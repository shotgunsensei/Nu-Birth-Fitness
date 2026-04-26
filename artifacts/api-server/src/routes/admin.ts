import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import { and, eq, desc, sql, gte } from "drizzle-orm";
import {
  db,
  leads,
  leadEvents,
  quizSubmissions,
  quizAnswers,
  bookingIntakes,
  emailSequences,
  emailLogs,
  settings as funnelSettings,
  type ResultType,
} from "@workspace/db";
import { env } from "../lib/env";
import { adminCookieName, makeAdminToken, requireAdmin } from "../middlewares/admin";
import { haltSequencesForLead } from "../lib/scheduler";
import { sendEmail } from "../lib/mailer";
import { buildOwnerBookingMessage } from "../lib/templates";

const router: IRouter = Router();

function setAdminCookie(res: Response) {
  res.cookie(adminCookieName(), makeAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

router.post("/admin/funnel/login", async (req, res) => {
  const schema = z.object({ password: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  if (!env.adminPassword) {
    res.status(503).json({ error: "ADMIN_PASSWORD is not configured" });
    return;
  }
  if (parsed.data.password !== env.adminPassword) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }
  setAdminCookie(res);
  res.json({ ok: true });
});

router.post("/admin/funnel/logout", async (_req, res) => {
  res.clearCookie(adminCookieName(), { path: "/" });
  res.json({ ok: true });
});

router.get("/admin/funnel/me", async (req, res) => {
  const token = req.cookies?.[adminCookieName()];
  const { verifyAdminToken } = await import("../middlewares/admin");
  res.json({ authenticated: verifyAdminToken(token), configured: Boolean(env.adminPassword) });
});

router.get("/admin/funnel/stats", requireAdmin, async (_req, res) => {
  const [totals] = await db
    .select({
      starts: sql<number>`count(*) filter (where event_name = 'QuizStarted')`,
      completes: sql<number>`count(*) filter (where event_name = 'QuizCompleted')`,
      bookCtaClicks: sql<number>`count(*) filter (where event_name = 'BookCTA_Clicked')`,
      trainingClicks: sql<number>`count(*) filter (where event_name = 'TrainingCTA_Clicked')`,
      trainingViews: sql<number>`count(*) filter (where event_name = 'TrainingViewed')`,
      intakeCompleted: sql<number>`count(*) filter (where event_name = 'IntakeCompleted')`,
      calendarOpened: sql<number>`count(*) filter (where event_name = 'CalendarOpened')`,
      bookedCall: sql<number>`count(*) filter (where event_name = 'BookedCall')`,
      resultViewed: sql<number>`count(*) filter (where event_name = 'ResultViewed')`,
    })
    .from(leadEvents);

  const [{ count: leadsCount }] = await db.select({ count: sql<number>`count(*)` }).from(leads);
  const [{ count: bookedCount }] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.status, "booked"));

  const breakdown = await db
    .select({ resultType: leads.resultType, count: sql<number>`count(*)` })
    .from(leads)
    .groupBy(leads.resultType);

  const conversionRate = Number(leadsCount) > 0 ? Number(bookedCount) / Number(leadsCount) : 0;

  res.json({
    totals: {
      quizStarts: Number(totals.starts ?? 0),
      quizCompletions: Number(totals.completes ?? 0),
      leadsCaptured: Number(leadsCount ?? 0),
      bookCtaClicks: Number(totals.bookCtaClicks ?? 0),
      trainingClicks: Number(totals.trainingClicks ?? 0),
      trainingViews: Number(totals.trainingViews ?? 0),
      intakeCompleted: Number(totals.intakeCompleted ?? 0),
      calendarOpened: Number(totals.calendarOpened ?? 0),
      bookedCalls: Number(bookedCount ?? 0),
      resultViewed: Number(totals.resultViewed ?? 0),
      conversionRate,
    },
    breakdown: breakdown.map((b) => ({ resultType: b.resultType, count: Number(b.count) })),
  });
});

router.get("/admin/funnel/leads", requireAdmin, async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 100), 500);
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);
  res.json({ leads: rows });
});

router.get("/admin/funnel/leads/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const lead = await db.query.leads.findFirst({ where: eq(leads.id, id) });
  if (!lead) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const submission = lead.sessionId
    ? await db.query.quizSubmissions.findFirst({ where: eq(quizSubmissions.sessionId, lead.sessionId) })
    : null;
  const answerRows = submission
    ? await db
        .select()
        .from(quizAnswers)
        .where(eq(quizAnswers.submissionId, submission.id))
        .orderBy(quizAnswers.id)
    : [];
  // Prefer the joined quiz_answers rows so the admin always sees actual selected
  // option keys + the bucket they scored into, even on legacy leads where the
  // submission.answersJson blob may have stored only the per-question result type.
  const answers: Record<string, { answerKey: string; answerType: string }> = {};
  for (const a of answerRows) {
    answers[a.questionKey] = { answerKey: a.answerKey, answerType: a.answerType };
  }
  const events = await db.select().from(leadEvents).where(eq(leadEvents.leadId, id)).orderBy(desc(leadEvents.createdAt)).limit(50);
  const intakes = await db.select().from(bookingIntakes).where(eq(bookingIntakes.leadId, id)).orderBy(desc(bookingIntakes.createdAt));
  const sequences = await db.select().from(emailSequences).where(eq(emailSequences.leadId, id));
  const emails = await db.select().from(emailLogs).where(eq(emailLogs.leadId, id)).orderBy(desc(emailLogs.sentAt)).limit(50);
  res.json({ lead, submission, answers, events, intakes, sequences, emails });
});

router.post("/admin/funnel/leads/:id/mark-booked", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const lead = await db.query.leads.findFirst({ where: eq(leads.id, id) });
  if (!lead) {
    res.status(404).json({ error: "Not found" });
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
    .where(eq(leads.id, id));
  await haltSequencesForLead(id);
  await db.insert(leadEvents).values({ leadId: id, eventName: "BookedCall", payload: { source: "admin" } });
  if (env.ownerEmail) {
    const tpl = buildOwnerBookingMessage({
      firstName: lead.firstName,
      email: lead.email,
      resultType: lead.resultType as ResultType,
      source: "admin",
      siteUrl: env.publicSiteUrl || "",
    });
    sendEmail({ to: env.ownerEmail, subject: tpl.subject, html: tpl.body }).catch(() => {});
  }
  res.json({ ok: true });
});

router.get("/admin/funnel/settings", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(funnelSettings);
  const overrides: Record<string, string> = {};
  for (const r of rows) overrides[r.key] = r.value;
  // Merge: env defaults are the base, DB overrides win.
  const effective = {
    bookingUrl: overrides.bookingUrl ?? env.bookingUrl ?? "",
    publicSiteUrl: overrides.publicSiteUrl ?? env.publicSiteUrl ?? "",
    trainingVideoUrl: overrides.trainingVideoUrl ?? env.trainingVideoUrl ?? "",
    ownerEmail: overrides.ownerEmail ?? env.ownerEmail ?? "",
    mailingAddress: overrides.mailingAddress ?? env.mailingAddress ?? "",
    resultVideos: {
      all_or_nothing: overrides.resultVideo_all_or_nothing ?? env.resultVideos.all_or_nothing ?? "",
      stuck_loop: overrides.resultVideo_stuck_loop ?? env.resultVideos.stuck_loop ?? "",
      overwhelmed: overrides.resultVideo_overwhelmed ?? env.resultVideos.overwhelmed ?? "",
      lost_herself: overrides.resultVideo_lost_herself ?? env.resultVideos.lost_herself ?? "",
    },
  };
  res.json({ overrides, effective });
});

router.put("/admin/funnel/settings", requireAdmin, async (req, res) => {
  const schema = z.object({
    settings: z.record(z.string(), z.string()),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const entries = Object.entries(parsed.data.settings);
  for (const [key, value] of entries) {
    if (value === "") {
      await db.delete(funnelSettings).where(eq(funnelSettings.key, key));
    } else {
      await db
        .insert(funnelSettings)
        .values({ key, value, updatedAt: new Date() })
        .onConflictDoUpdate({ target: funnelSettings.key, set: { value, updatedAt: new Date() } });
    }
  }
  res.json({ ok: true, count: entries.length });
});

router.get("/admin/funnel/export.csv", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
  const headers = [
    "id",
    "first_name",
    "email",
    "phone",
    "result_type",
    "status",
    "tags",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "referrer",
    "device_type",
    "booked_at",
    "created_at",
  ];
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "string" ? v : JSON.stringify(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.firstName,
        r.email,
        r.phone ?? "",
        r.resultType,
        r.status,
        (r.tags ?? []).join("|"),
        r.utmSource ?? "",
        r.utmMedium ?? "",
        r.utmCampaign ?? "",
        r.referrer ?? "",
        r.deviceType ?? "",
        r.bookedAt ? new Date(r.bookedAt).toISOString() : "",
        new Date(r.createdAt).toISOString(),
      ]
        .map(escape)
        .join(","),
    );
  }
  res.setHeader("content-type", "text/csv; charset=utf-8");
  res.setHeader("content-disposition", `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(lines.join("\n"));
});

export default router;
