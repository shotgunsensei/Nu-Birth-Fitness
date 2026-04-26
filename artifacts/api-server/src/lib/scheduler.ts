import { db, leads, emailSequences, emailLogs, emailMessages } from "@workspace/db";
import type { ResultType } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { sendEmail } from "./mailer";
import { buildResultTenDayMessage, buildMomResetMessage } from "./templates";
import { env } from "./env";
import { logger } from "./logger";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const RETRY_MS = 30 * 60 * 1000;
const STALE_MS = 15 * 60 * 1000;

function bookingUrl(): string {
  return env.bookingUrl || `${env.publicSiteUrl}/book/all-or-nothing`;
}

function unsubscribeUrl(token: string | null | undefined): string {
  const base = env.publicSiteUrl || "";
  return token
    ? `${base}/api/unsubscribe?token=${encodeURIComponent(token)}`
    : `${base}/api/unsubscribe`;
}

function applyVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

async function renderTemplate(
  sequenceType: string,
  resultType: ResultType,
  step: number,
  firstName: string,
  unsubUrl: string,
): Promise<{ subject: string; body: string }> {
  const vars = { firstName, bookingUrl: bookingUrl(), unsubscribeUrl: unsubUrl, resultType };
  const rows = await db
    .select({ subject: emailMessages.subject, body: emailMessages.body })
    .from(emailMessages)
    .where(
      and(
        eq(emailMessages.sequenceType, sequenceType),
        eq(emailMessages.step, step),
        sequenceType === "result_10day"
          ? eq(emailMessages.resultType, resultType)
          : sql`${emailMessages.resultType} IS NULL`,
      ),
    )
    .limit(1);
  const row = rows[0];
  if (row) {
    return { subject: applyVars(row.subject, vars), body: applyVars(row.body, vars) };
  }
  return sequenceType === "result_10day"
    ? buildResultTenDayMessage({ step, firstName, resultType, bookingUrl: bookingUrl(), unsubscribeUrl: unsubUrl })
    : buildMomResetMessage({ step, firstName, resultType, bookingUrl: bookingUrl(), unsubscribeUrl: unsubUrl });
}

async function processDueSequences(): Promise<void> {
  const now = new Date();
  // Revive sequences stuck in 'sending' so a crashed worker doesn't strand them.
  await db
    .update(emailSequences)
    .set({ status: "active", updatedAt: new Date() })
    .where(sql`status = 'sending' AND updated_at <= ${new Date(Date.now() - STALE_MS)}`);

  const claimed = await db
    .update(emailSequences)
    .set({ status: "sending", updatedAt: new Date() })
    .where(
      sql`${emailSequences.id} IN (
        SELECT id FROM ${emailSequences}
        WHERE status = 'active'
          AND next_send_at IS NOT NULL
          AND next_send_at <= ${now}
        ORDER BY next_send_at ASC
        LIMIT 50
        FOR UPDATE SKIP LOCKED
      )`,
    )
    .returning();

  for (const seq of claimed) {
    const lead = await db.query.leads.findFirst({ where: eq(leads.id, seq.leadId) });
    if (!lead) {
      await db
        .update(emailSequences)
        .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
        .where(eq(emailSequences.id, seq.id));
      continue;
    }
    if (lead.status === "booked" || lead.unsubscribed) {
      await db
        .update(emailSequences)
        .set({
          status: lead.unsubscribed ? "unsubscribed" : "halted_booked",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emailSequences.id, seq.id));
      continue;
    }

    const resultType = (seq.resultType ?? lead.resultType) as ResultType;
    const tpl = await renderTemplate(
      seq.sequenceType,
      resultType,
      seq.currentStep,
      lead.firstName,
      unsubscribeUrl(lead.unsubscribeToken),
    );

    const result = await sendEmail({ to: lead.email, subject: tpl.subject, html: tpl.body });
    await db.insert(emailLogs).values({
      leadId: lead.id,
      sequenceId: seq.id,
      step: seq.currentStep,
      subject: tpl.subject,
      body: tpl.body,
      toEmail: lead.email,
      provider: "resend",
      status: result.ok ? "sent" : "error",
      errorMessage: result.error ?? null,
    });

    if (!result.ok) {
      // Don't advance the step on failure; back off and retry on the next tick.
      await db
        .update(emailSequences)
        .set({
          status: "active",
          nextSendAt: new Date(Date.now() + RETRY_MS),
          updatedAt: new Date(),
        })
        .where(eq(emailSequences.id, seq.id));
      logger.warn({ seqId: seq.id, error: result.error }, "[scheduler] send failed; will retry");
      continue;
    }

    const nextStep = seq.currentStep + 1;
    if (nextStep >= seq.totalSteps) {
      await db
        .update(emailSequences)
        .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
        .where(eq(emailSequences.id, seq.id));
      if (seq.sequenceType === "result_10day") {
        await db.insert(emailSequences).values({
          leadId: lead.id,
          sequenceType: "mom_reset_5day",
          resultType,
          currentStep: 0,
          totalSteps: 5,
          status: "active",
          nextSendAt: new Date(Date.now() + DAY_MS),
        });
      }
    } else {
      await db
        .update(emailSequences)
        .set({
          currentStep: nextStep,
          nextSendAt: new Date(Date.now() + DAY_MS),
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(emailSequences.id, seq.id));
    }
  }
  if (claimed.length > 0) {
    logger.info({ processed: claimed.length }, "[scheduler] processed sequence steps");
  }
}

export async function startSequenceForLead(leadId: number, resultType: ResultType): Promise<void> {
  await db.insert(emailSequences).values({
    leadId,
    sequenceType: "result_10day",
    resultType,
    currentStep: 0,
    totalSteps: 11,
    status: "active",
    nextSendAt: new Date(),
  });
  await processDueSequences();
}

export async function haltSequencesForLead(leadId: number): Promise<void> {
  await db
    .update(emailSequences)
    .set({ status: "halted_booked", completedAt: new Date() })
    .where(and(eq(emailSequences.leadId, leadId), eq(emailSequences.status, "active")));
}

let interval: NodeJS.Timeout | null = null;
export function startSchedulerLoop(): void {
  if (interval) return;
  // Run an immediate catch-up tick after boot so any messages that came due
  // during downtime get processed without waiting up to an hour for the next
  // interval. Errors are logged, never thrown — boot must not fail on this.
  processDueSequences().catch((err) =>
    logger.error({ err }, "[scheduler] startup catch-up tick error"),
  );
  interval = setInterval(() => {
    processDueSequences().catch((err) => logger.error({ err }, "[scheduler] tick error"));
  }, HOUR_MS);
  logger.info("[scheduler] started (immediate catch-up + hourly tick)");
}

export async function tickNow(): Promise<void> {
  await processDueSequences();
}
