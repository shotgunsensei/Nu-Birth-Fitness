import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { and, eq, desc, gte, sql } from "drizzle-orm";
import {
  db,
  leads,
  quizSubmissions,
  quizAnswers,
  leadEvents,
  bookingIntakes,
  emailSequences,
  emailLogs,
  settings as funnelSettings,
  RESULT_TYPES,
  type ResultType,
} from "@workspace/db";
import { sendEmail } from "../lib/mailer";
import {
  buildResultTenDayMessage,
  buildOwnerNewLeadMessage,
  buildOwnerBookingMessage,
} from "../lib/templates";
import { startSequenceForLead, haltSequencesForLead } from "../lib/scheduler";
import { requireAdmin } from "../middlewares/admin";
import { env } from "../lib/env";
import { logger } from "../lib/logger";

// Extracts a 64-char hex sha256 digest from common signature header formats:
//   - bare hex                            -> "abc123..."
//   - GitHub-style scheme=hex             -> "sha256=abc123..."
//   - Stripe-style timestamped pairs      -> "t=12345,v1=abc123..."
// Returns "" when no valid candidate is found so the caller fails closed.
function extractHexSignature(header: string): string {
  if (!header) return "";
  const trimmed = header.trim();
  const isHex64 = (s: string) => /^[a-f0-9]{64}$/i.test(s);
  if (isHex64(trimmed)) return trimmed.toLowerCase();
  for (const part of trimmed.split(",")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const value = part.slice(eq + 1).trim();
    if (isHex64(value)) return value.toLowerCase();
  }
  return "";
}

const router: IRouter = Router();

const ResultEnum = z.enum(RESULT_TYPES);

router.post("/quiz/start", async (req, res) => {
  const schema = z.object({ sessionId: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { sessionId } = parsed.data;
  const existing = await db.query.quizSubmissions.findFirst({ where: eq(quizSubmissions.sessionId, sessionId) });
  if (!existing) {
    await db.insert(quizSubmissions).values({ sessionId });
  }
  await db.insert(leadEvents).values({ sessionId, eventName: "QuizStarted" });
  res.json({ ok: true });
});

router.post("/quiz/answer", async (req, res) => {
  const schema = z.object({
    sessionId: z.string().min(1),
    questionKey: z.string().min(1),
    answerKey: z.string().min(1),
    answerType: ResultEnum,
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { sessionId, questionKey, answerKey, answerType } = parsed.data;
  let sub = await db.query.quizSubmissions.findFirst({ where: eq(quizSubmissions.sessionId, sessionId) });
  if (!sub) {
    const [created] = await db.insert(quizSubmissions).values({ sessionId }).returning();
    sub = created;
  }
  await db.insert(quizAnswers).values({
    submissionId: sub.id,
    questionKey,
    answerKey,
    answerType,
  });
  await db.insert(leadEvents).values({ sessionId, eventName: "QuizQuestionAnswered", payload: { questionKey, answerType } });
  res.json({ ok: true });
});

router.post("/quiz/complete", async (req, res) => {
  const schema = z.object({
    sessionId: z.string().min(1),
    resultType: ResultEnum,
    scoreJson: z.record(z.string(), z.number()),
    answersJson: z.record(z.string(), z.string()),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { sessionId, resultType, scoreJson, answersJson } = parsed.data;
  let sub = await db.query.quizSubmissions.findFirst({ where: eq(quizSubmissions.sessionId, sessionId) });
  if (!sub) {
    const [created] = await db.insert(quizSubmissions).values({ sessionId }).returning();
    sub = created;
  }
  await db
    .update(quizSubmissions)
    .set({ resultType, scoreJson, answersJson, completedAt: new Date() })
    .where(eq(quizSubmissions.id, sub.id));
  await db.insert(leadEvents).values({ sessionId, eventName: "QuizCompleted", payload: { resultType } });
  res.json({ ok: true });
});

const LeadBody = z.object({
  firstName: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  consent: z.boolean(),
  resultType: ResultEnum,
  sessionId: z.string().optional(),
  scoreJson: z.record(z.string(), z.number()).optional(),
  answersJson: z.record(z.string(), z.string()).optional(),
  utm: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      content: z.string().optional(),
      term: z.string().optional(),
    })
    .optional(),
  referrer: z.string().optional(),
  deviceType: z.string().optional(),
  source: z.string().optional(),
});

router.post("/leads", async (req, res) => {
  const parsed = LeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", issues: parsed.error.issues });
    return;
  }
  const b = parsed.data;
  // CAN-SPAM / GDPR posture: no consent → no row, no events, no email. The
  // frontend already enforces the checkbox; this guard hardens against direct
  // API callers and avoids accidentally enrolling someone in nurture.
  if (!b.consent) {
    res.status(400).json({ error: "Consent is required to capture a lead." });
    return;
  }
  const existing = await db.query.leads.findFirst({ where: eq(leads.email, b.email) });
  let leadId: number;
  if (existing) {
    // Merge tags: keep historical tags (incl. "booked_call") and ensure the
    // current result_type is present so the admin filter chips reflect every
    // bucket this contact has fallen into across re-takes.
    const mergedTags = Array.from(new Set([...(existing.tags ?? []), b.resultType]));
    await db
      .update(leads)
      .set({
        firstName: b.firstName,
        phone: b.phone ?? existing.phone,
        consent: b.consent || existing.consent,
        resultType: b.resultType,
        tags: mergedTags,
        utmSource: b.utm?.source ?? existing.utmSource,
        utmMedium: b.utm?.medium ?? existing.utmMedium,
        utmCampaign: b.utm?.campaign ?? existing.utmCampaign,
        utmContent: b.utm?.content ?? existing.utmContent,
        utmTerm: b.utm?.term ?? existing.utmTerm,
        referrer: b.referrer ?? existing.referrer,
        deviceType: b.deviceType ?? existing.deviceType,
        sessionId: b.sessionId ?? existing.sessionId,
        source: b.source ?? existing.source,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, existing.id));
    leadId = existing.id;
  } else {
    const unsubToken = crypto.randomBytes(24).toString("base64url");
    const [created] = await db
      .insert(leads)
      .values({
        firstName: b.firstName,
        email: b.email,
        phone: b.phone ?? null,
        consent: b.consent,
        resultType: b.resultType,
        utmSource: b.utm?.source,
        utmMedium: b.utm?.medium,
        utmCampaign: b.utm?.campaign,
        utmContent: b.utm?.content,
        utmTerm: b.utm?.term,
        referrer: b.referrer,
        deviceType: b.deviceType,
        sessionId: b.sessionId,
        source: b.source,
        tags: [b.resultType],
        unsubscribeToken: unsubToken,
      })
      .returning();
    leadId = created.id;
  }

  if (b.sessionId) {
    const sub = await db.query.quizSubmissions.findFirst({ where: eq(quizSubmissions.sessionId, b.sessionId) });
    if (sub) {
      await db
        .update(quizSubmissions)
        .set({
          leadId,
          resultType: b.resultType,
          scoreJson: b.scoreJson ?? sub.scoreJson,
          answersJson: b.answersJson ?? sub.answersJson,
          completedAt: sub.completedAt ?? new Date(),
        })
        .where(eq(quizSubmissions.id, sub.id));
    }
  }

  await db.insert(leadEvents).values({ leadId, sessionId: b.sessionId ?? null, eventName: "LeadCaptured", payload: { resultType: b.resultType } });

  // Kick off nurture
  if (!existing) {
    try {
      await startSequenceForLead(leadId, b.resultType);
    } catch (err) {
      logger.error({ err }, "[funnel] failed to start sequence");
    }
  }

  // Notify owner
  if (env.ownerEmail) {
    const tpl = buildOwnerNewLeadMessage({
      firstName: b.firstName,
      email: b.email,
      phone: b.phone ?? null,
      resultType: b.resultType,
      siteUrl: env.publicSiteUrl || "",
    });
    sendEmail({ to: env.ownerEmail, subject: tpl.subject, html: tpl.body }).catch((err) =>
      logger.error({ err }, "[funnel] owner notify failed"),
    );
  }

  // Outbound CRM webhook
  if (env.crmWebhookUrl) {
    fetch(env.crmWebhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "lead.captured", lead: { id: leadId, email: b.email, firstName: b.firstName, phone: b.phone, resultType: b.resultType } }),
    }).catch((err) => logger.error({ err }, "[funnel] crm webhook failed"));
  }

  res.json({ ok: true, leadId });
});

router.post("/events", async (req, res) => {
  const schema = z.object({
    eventName: z.string().min(1).max(120),
    sessionId: z.string().optional(),
    leadId: z.number().int().optional(),
    payload: z.record(z.string(), z.unknown()).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { eventName, sessionId, leadId, payload } = parsed.data;
  await db.insert(leadEvents).values({ eventName, sessionId: sessionId ?? null, leadId: leadId ?? null, payload: payload ?? null });
  res.json({ ok: true });
});

router.post("/intake", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    resultType: ResultEnum,
    biggestStruggle: z.string().optional(),
    goal90Days: z.string().optional(),
    triedBefore: z.string().optional(),
    knockedOff: z.string().optional(),
    howSoon: z.string().optional(),
    openToCoaching: z.string().optional(),
    bestPhone: z.string().optional(),
    bestTime: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const b = parsed.data;
  const lead = await db.query.leads.findFirst({ where: eq(leads.email, b.email) });
  await db.insert(bookingIntakes).values({
    leadId: lead?.id ?? null,
    email: b.email,
    resultType: b.resultType,
    biggestStruggle: b.biggestStruggle,
    goal90Days: b.goal90Days,
    triedBefore: b.triedBefore,
    knockedOff: b.knockedOff,
    howSoon: b.howSoon,
    openToCoaching: b.openToCoaching,
    bestPhone: b.bestPhone,
    bestTime: b.bestTime,
  });
  if (lead) {
    await db.insert(leadEvents).values({ leadId: lead.id, eventName: "IntakeCompleted", payload: { resultType: b.resultType } });
  }
  res.json({ ok: true });
});

router.post("/webhooks/booking", async (req, res) => {
  // In production, the secret is mandatory — fail closed if it's missing.
  if (process.env.NODE_ENV === "production" && !env.bookingWebhookSecret) {
    logger.error("[funnel] BOOKING_WEBHOOK_SECRET is required in production");
    res.status(503).json({ error: "Webhook secret not configured" });
    return;
  }
  // Verify signature when BOOKING_WEBHOOK_SECRET is configured.
  // Provider sends `x-booking-signature: <sha256-hex>` of the raw request bytes.
  // We accept either the bare hex digest or common prefixed formats such as
  // `sha256=<hex>` (GitHub-style) and `t=...,v1=<hex>` (Stripe-style) to
  // reduce integration friction with the variety of providers in the wild.
  // When the secret is unset (dev only) we accept the call but log a warning.
  if (env.bookingWebhookSecret) {
    const rawHeader = (req.headers["x-booking-signature"] || req.headers["x-webhook-signature"] || "").toString().trim();
    const provided = extractHexSignature(rawHeader);
    const raw = (req as typeof req & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    const expected = crypto.createHmac("sha256", env.bookingWebhookSecret).update(raw).digest("hex");
    const a = Buffer.from(provided, "utf8");
    const b = Buffer.from(expected, "utf8");
    const ok = provided.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!ok) {
      logger.warn({ ip: req.ip }, "[funnel] booking webhook signature mismatch");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }
  } else {
    logger.warn("[funnel] BOOKING_WEBHOOK_SECRET not set — accepting webhook unauthenticated (dev only)");
  }
  const body = req.body ?? {};
  const email = (body.email ?? body.invitee_email ?? body.payload?.email ?? body.contact?.email ?? "").toString().toLowerCase().trim();
  if (!email) {
    res.status(400).json({ error: "email required" });
    return;
  }
  const lead = await db.query.leads.findFirst({ where: eq(leads.email, email) });
  if (!lead) {
    res.status(202).json({ ok: true, matched: false });
    return;
  }
  await db
    .update(leads)
    .set({
      status: "booked",
      bookedAt: new Date(),
      tags: Array.from(new Set([...(lead.tags ?? []), "booked_call"])),
      updatedAt: new Date(),
    })
    .where(eq(leads.id, lead.id));
  await haltSequencesForLead(lead.id);
  await db.insert(leadEvents).values({ leadId: lead.id, eventName: "BookedCall", payload: { source: "webhook" } });

  if (env.ownerEmail) {
    const tpl = buildOwnerBookingMessage({
      firstName: lead.firstName,
      email: lead.email,
      resultType: lead.resultType as ResultType,
      source: "webhook",
      siteUrl: env.publicSiteUrl || "",
    });
    sendEmail({ to: env.ownerEmail, subject: tpl.subject, html: tpl.body }).catch(() => {});
  }
  res.json({ ok: true, matched: true });
});

// /email/test: admin-only smoke endpoint, refused entirely in production.
// Returns 404 in prod so the route is invisible on the deployed surface, and
// is admin-gated everywhere else so an unauthenticated caller cannot trigger
// outbound mail through our Resend account (spam / quota burn / sender
// reputation).
const blockInProduction: import("express").RequestHandler = (_req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    res.status(404).json({ error: "Not available in production" });
    return;
  }
  next();
};
router.post("/email/test", blockInProduction, requireAdmin, async (req, res) => {
  const schema = z.object({ to: z.string().email(), resultType: ResultEnum.optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const tpl = buildResultTenDayMessage({
    step: 0,
    firstName: "Friend",
    resultType: parsed.data.resultType ?? "all_or_nothing",
    bookingUrl: env.bookingUrl || env.publicSiteUrl || "#",
    unsubscribeUrl: `${env.publicSiteUrl || ""}/api/unsubscribe`,
  });
  const result = await sendEmail({ to: parsed.data.to, subject: tpl.subject, html: tpl.body });
  res.json(result);
});

router.get("/unsubscribe", async (req, res) => {
  const token = (req.query.token ?? "").toString();
  if (!token) {
    res.status(400).type("html").send("<h1>Missing token.</h1>");
    return;
  }
  const lead = await db.query.leads.findFirst({ where: eq(leads.unsubscribeToken, token) });
  if (!lead) {
    res.status(404).type("html").send("<h1>Link not recognized.</h1><p>You may already be unsubscribed.</p>");
    return;
  }
  await db
    .update(leads)
    .set({ unsubscribed: true, unsubscribedAt: new Date(), updatedAt: new Date() })
    .where(eq(leads.id, lead.id));
  await db
    .update(emailSequences)
    .set({ status: "unsubscribed", completedAt: new Date() })
    .where(and(eq(emailSequences.leadId, lead.id), eq(emailSequences.status, "active")));
  await db.insert(leadEvents).values({ leadId: lead.id, eventName: "Unsubscribed", payload: { source: "link" } });
  res.type("html").send(`<!doctype html><html><body style="font-family:system-ui;padding:48px;text-align:center;">
    <h1 style="font-family:Georgia,serif;">You're unsubscribed.</h1>
    <p>We won't send you any more emails. Take care.</p>
  </body></html>`);
});

router.get("/funnel/settings", async (_req, res) => {
  // Merge env defaults with DB overrides written via PUT /admin/funnel/settings
  // so admin-configured booking/video URLs are honored by the public funnel.
  const rows = await db.select().from(funnelSettings);
  const o: Record<string, string> = {};
  for (const r of rows) o[r.key] = r.value;
  res.json({
    bookingUrl: o.bookingUrl || env.bookingUrl || null,
    publicSiteUrl: o.publicSiteUrl || env.publicSiteUrl || null,
    resultVideos: {
      all_or_nothing: o.resultVideo_all_or_nothing || env.resultVideos.all_or_nothing || "",
      stuck_loop: o.resultVideo_stuck_loop || env.resultVideos.stuck_loop || "",
      overwhelmed: o.resultVideo_overwhelmed || env.resultVideos.overwhelmed || "",
      lost_herself: o.resultVideo_lost_herself || env.resultVideos.lost_herself || "",
    },
    trainingVideoUrl: o.trainingVideoUrl || env.trainingVideoUrl || null,
  });
});

export default router;
