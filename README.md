# NU-Birth Fitness + Reset Trap Quiz Funnel

pnpm-workspace monorepo. The primary product is the **NU-Birth Fitness** PWA, a YouTube-powered training site for moms, with a high-converting **Reset Trap Quiz** funnel layered on top.

## Quick start

```bash
pnpm install
pnpm --filter @workspace/api-server run dev      # Express API on /api
pnpm --filter @workspace/nu-birth-fitness run dev # PWA + funnel pages
```

The Replit workflows `artifacts/api-server: API Server` and `artifacts/nu-birth-fitness: web` start both automatically.

## Repository layout

```
artifacts/
  api-server/         Express 5 API (mounted at /api). Funnel routes,
                      admin dashboard, email scheduler, booking webhook.
  nu-birth-fitness/   React 18 + Vite PWA. Existing Home/Videos/Playlists
                      plus /reset-trap-quiz, /quiz/contact, /results/:slug,
                      /book/:slug, /training/:slug, /admin/funnel.
  mockup-sandbox/     Canvas / design preview server.
lib/
  db/                 Drizzle schema + client (PostgreSQL).
  api-spec/           OpenAPI 3 spec — source of truth for API contracts.
  api-zod/            Generated Zod schemas + types from the OpenAPI spec.
```

## Reset Trap Quiz funnel

End-to-end flow: **9-question quiz → 4 mom types → lead capture → result page (training + booking CTAs) → 11-step result email nurture chained into a 5-day Mom Reset sequence**.

- Schema lives in `lib/db/src/schema/funnel.ts` (`funnel_quiz_sessions`, `funnel_quiz_submissions`, `funnel_leads`, `funnel_lead_events`, `funnel_booking_intakes`, `funnel_email_sequences`, `funnel_email_messages`, `funnel_email_logs`, `funnel_settings`).
- Email templates are seeded from code into `funnel_email_messages` on first boot. The scheduler renders from those DB rows (with code-template fallback) so the owner can edit copy without a code change.
- Tracking: GA4, Meta Pixel, and an internal `funnel_lead_events` log all receive each event (`PageView`, `QuizStarted`, `QuizQuestionAnswered`, `QuizCompleted`, `LeadCaptured`, `ResultViewed`, `BookCTA_Clicked`, `BookedCall`, `TrainingCTA_Clicked`, `TrainingViewed`, `IntakeCompleted`, `CalendarOpened`, `HomeCTA_Clicked`, `HeaderCTA_Clicked`).
- Admin dashboard at `/admin/funnel` is gated by the `ADMIN_PASSWORD` env var (returns "Admin not configured" until set). Surfaces totals, per-type breakdowns, lead detail with quiz answers + tags + intakes + emails, mark-booked, CSV export, and editable settings (booking URL, training video URL, per-result video URLs, etc.).
- Booking webhook (`POST /api/webhooks/booking`) verifies HMAC-SHA256 signatures from `BOOKING_WEBHOOK_SECRET` (fail-closed in production) and marks the matching lead booked, halting the nurture sequence.
- Unsubscribe is CAN-SPAM compliant via signed tokens at `/api/unsubscribe?token=…`.

See `FUNNEL_NOTES.md` for the full operator handoff (env vars, copy edits, calendar provider setup, deliverability checklist).

### Admin metrics — source of truth

The `/admin/funnel` dashboard is intentionally a mix of two data sources, depending on which is more authoritative:

| KPI | Source |
|---|---|
| Booked Calls | `funnel_leads.status = 'booked'` (lead-state) — the webhook / admin "Mark Booked" updates this directly. |
| Quiz Starts, Quiz Completions, Leads Captured, Book CTA Clicks (`BookCTA_Clicked`), Training Clicks (`TrainingCTA_Clicked`), Training Views (`TrainingViewed`), Intake Completed, Calendar Opened, Result Viewed | `funnel_lead_events` row counts grouped by `event_name` (event-stream). |
| Conversion | `bookedCalls / leadsCaptured`. |
| Per-type breakdown | `funnel_leads` grouped by `result_type`. |

Event-derived counters reflect every fire (including duplicates from re-renders); booked-call counters reflect distinct leads. Treat them accordingly when reading the dashboard.

## Database

Drizzle with `pnpm --filter @workspace/db run db:push --force` (no checked-in migrations — push-only). The API server seeds default email templates on boot if `funnel_email_messages` is empty.

## Environment

See `.env.example`. Required for full funnel:

| Var | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Signs admin auth + unsubscribe tokens |
| `ADMIN_PASSWORD` | Unlocks `/admin/funnel` |
| `BOOKING_WEBHOOK_SECRET` | HMAC secret for `POST /api/funnel/booking-webhook` |
| `RESEND_API_KEY` (or `MAIL_DEV=1`) | Email send provider; in dev unset → emails log to console |
| `VITE_GA4_MEASUREMENT_ID`, `VITE_META_PIXEL_ID` | Optional analytics IDs |
| `VITE_YOUTUBE_API_KEY` | Existing YouTube content for the PWA |

## Tests

```bash
pnpm --filter @workspace/nu-birth-fitness exec tsc --noEmit
pnpm --filter @workspace/api-server exec tsc --noEmit
```

End-to-end smoke is run via the Replit testing skill (Playwright) — see commit history for representative runs covering quiz → lead → result → booking → admin.
