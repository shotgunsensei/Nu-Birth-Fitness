import { db, leads, emailSequences, emailLogs } from "@workspace/db";
import type { ResultType } from "@workspace/db";
import { and, eq, lte, isNotNull, sql } from "drizzle-orm";
import { sendEmail } from "./mailer";
import { buildResultTenDayMessage, buildMomResetMessage } from "./templates";
import { env } from "./env";
import { logger } from "./logger";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function bookingUrl() {
  return env.bookingUrl || `${env.publicSiteUrl}/book/all-or-nothing`;
}

function unsubscribeUrl(token: string | null | undefined): string {
  if (!token) return `${env.publicSiteUrl || ""}/api/unsubscribe`;
  return `${env.publicSiteUrl || ""}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}

async function processDueSequences() {
  const now = new Date();
  // Reaper: revive sequences stuck in 'sending' for >15 minutes (a worker crashed
  // between claim and finalize). Without this, those rows would be stranded
  // forever and the lead would silently miss the rest of their nurture.
  const STALE_MS = 15 * 60 * 1000;
  await db
    .update(emailSequences)
    .set({ status: "active", updatedAt: new Date() })
    .where(
      sql`status = 'sending' AND updated_at <= ${new Date(Date.now() - STALE_MS)}`,
    );
  // Atomically claim a batch of due sequences by flipping status to 'sending'.
  // Without this, a concurrent invocation (overlapping ticks, multiple instances,
  // or a parallel startSequenceForLead) could pick up the same row and send twice.
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

  const due = claimed;
  for (const seq of due) {
    const lead = await db.query.leads.findFirst({ where: eq(leads.id, seq.leadId) });
    if (!lead) {
      await db.update(emailSequences).set({ status: "completed", completedAt: new Date(), updatedAt: new Date() }).where(eq(emailSequences.id, seq.id));
      continue;
    }
    if (lead.status === "booked" || lead.unsubscribed) {
      await db
        .update(emailSequences)
        .set({ status: lead.unsubscribed ? "unsubscribed" : "halted_booked", completedAt: new Date(), updatedAt: new Date() })
        .where(eq(emailSequences.id, seq.id));
      continue;
    }
    const resultType = (seq.resultType ?? lead.resultType) as ResultType;
    const unsubUrl = unsubscribeUrl(lead.unsubscribeToken);
    const tpl =
      seq.sequenceType === "result_10day"
        ? buildResultTenDayMessage({ step: seq.currentStep, firstName: lead.firstName, resultType, bookingUrl: bookingUrl(), unsubscribeUrl: unsubUrl })
        : buildMomResetMessage({ step: seq.currentStep, firstName: lead.firstName, resultType, bookingUrl: bookingUrl(), unsubscribeUrl: unsubUrl });

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

    const nextStep = seq.currentStep + 1;
    if (nextStep >= seq.totalSteps) {
      // Sequence complete
      if (seq.sequenceType === "result_10day") {
        // Chain into 5-day reset
        await db.update(emailSequences).set({ status: "completed", completedAt: new Date() }).where(eq(emailSequences.id, seq.id));
        await db.insert(emailSequences).values({
          leadId: lead.id,
          sequenceType: "mom_reset_5day",
          resultType,
          currentStep: 0,
          totalSteps: 5,
          status: "active",
          nextSendAt: new Date(Date.now() + DAY_MS),
        });
        await db
          .update(emailSequences)
          .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
          .where(eq(emailSequences.id, seq.id));
      } else {
        await db.update(emailSequences).set({ status: "completed", completedAt: new Date(), updatedAt: new Date() }).where(eq(emailSequences.id, seq.id));
      }
    } else {
      // Re-arm the sequence: bump step, schedule next send, return status to 'active'.
      await db
        .update(emailSequences)
        .set({ currentStep: nextStep, nextSendAt: new Date(Date.now() + DAY_MS), status: "active", updatedAt: new Date() })
        .where(eq(emailSequences.id, seq.id));
    }
  }
  if (due.length > 0) {
    logger.info({ processed: due.length }, "[scheduler] processed sequence steps");
  }
}

export async function startSequenceForLead(leadId: number, resultType: ResultType) {
  // Day 0 result email goes immediately
  await db.insert(emailSequences).values({
    leadId,
    sequenceType: "result_10day",
    resultType,
    currentStep: 0,
    totalSteps: 11,
    status: "active",
    nextSendAt: new Date(),
  });
  // Process immediately so day-0 fires now
  await processDueSequences();
}

export async function haltSequencesForLead(leadId: number) {
  await db.update(emailSequences).set({ status: "halted_booked", completedAt: new Date() }).where(and(eq(emailSequences.leadId, leadId), eq(emailSequences.status, "active")));
}

let interval: NodeJS.Timeout | null = null;
export function startSchedulerLoop() {
  if (interval) return;
  interval = setInterval(() => {
    processDueSequences().catch((err) => logger.error({ err }, "[scheduler] tick error"));
  }, HOUR_MS);
  logger.info("[scheduler] started (hourly tick)");
}

export async function tickNow() {
  await processDueSequences();
}
