# Reset Trap Quiz Funnel — Operations Notes

This document covers the funnel that lives at `/reset-trap-quiz` inside the
`artifacts/nu-birth-fitness` web app, with backend support in
`artifacts/api-server`.

## Routes (frontend)

| Path | Description |
| --- | --- |
| `/reset-trap-quiz` | Landing page with primary CTA into the quiz. |
| `/quiz` | 9-question quiz, one question per screen. |
| `/quiz/contact` | Email/phone capture before showing result. |
| `/results/:slug` | Personalized result page (4 mom types). |
| `/book/:slug` | Pre-call intake form + embedded booking calendar. |
| `/training/:slug` | 4-minute training video as the "not ready yet" path. |
| `/admin/funnel` | Password-gated admin dashboard. |

`:slug` is one of `all-or-nothing`, `stuck-in-the-loop`, `overwhelmed`,
`lost-herself`.

## API endpoints (`/api/...`)

Public:

- `POST /quiz/start` — `{ sessionId }`
- `POST /quiz/answer` — `{ sessionId, questionKey, answerKey, answerType }`
- `POST /quiz/complete` — `{ sessionId, resultType, scoreJson, answersJson }`
- `POST /leads` — captures lead, kicks off email nurture
- `POST /events` — generic event log (also called from frontend tracker)
- `POST /intake` — booking intake answers
- `POST /webhooks/booking` — inbound webhook (Calendly/Cal.com etc.); marks
  lead booked, halts sequences, notifies owner. Looks for `email` (or
  `invitee_email`, nested `payload.email` / `contact.email`).
- `GET  /funnel/settings` — booking + video URLs the frontend needs
- `POST /email/test` — admin/dev: send the day-0 email to a chosen address

Admin (cookie session, `ADMIN_PASSWORD` required):

- `POST /admin/funnel/login` / `POST /admin/funnel/logout` / `GET /admin/funnel/me`
- `GET  /admin/funnel/stats` — totals + mom-type breakdown
- `GET  /admin/funnel/leads?limit=200`
- `GET  /admin/funnel/leads/:id` — full detail (events, intake, sequences, emails)
- `POST /admin/funnel/leads/:id/mark-booked`
- `GET  /admin/funnel/export.csv`

## Email nurture

Two sequences, sent from a single hourly scheduler tick (`lib/scheduler.ts`):

1. **Result 10-day** — auto-started when a lead is captured. Day 0 fires
   immediately; days 1-10 send daily.
2. **Mom Reset 5-day** — automatically chained when the 10-day sequence
   completes; days 1-5 daily.

Both sequences halt automatically when:

- The lead status flips to `booked` (via webhook or admin action), or
- The lead row is deleted.

Templates live in `lib/templates.ts`. They use the brand shell HTML and pull
the booking URL from `BOOKING_URL`.

## Mailer

`lib/mailer.ts` uses Resend if `RESEND_API_KEY` and `EMAIL_FROM` are set,
otherwise a console fallback that logs `[mail:dev] would send email` (no
network call). Owner notifications are sent to `OWNER_EMAIL`.

## Tracking

Frontend `funnel/track.ts` fires three places per event:

1. **GA4** (if `VITE_GA4_MEASUREMENT_ID` is set)
2. **Meta Pixel** (if `VITE_META_PIXEL_ID` is set) — common events mapped to
   `Lead`, `Schedule`; everything else as `trackCustom`.
3. **Internal** — `POST /api/events` for the admin dashboard.

Events used: `PageView`, `HomeCTA_Clicked`, `HeaderCTA_Clicked`,
`QuizStarted`, `QuizQuestionAnswered`, `QuizCompleted`, `LeadCaptured`,
`ResultViewed`, `BookCTA_Clicked`, `TrainingCTA_Clicked`, `TrainingViewed`,
`IntakeCompleted`, `CalendarOpened`, `BookedCall`.

## Required environment variables (API server)

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Admin dashboard login. |
| `SESSION_SECRET` | HMAC for the admin cookie. |
| `RESEND_API_KEY` | Outbound email (optional — falls back to console log). |
| `EMAIL_FROM` | Outbound `from` address. |
| `OWNER_EMAIL` | Where new-lead/booking notifications go. |
| `PUBLIC_SITE_URL` | Used in admin links inside owner emails. |
| `BOOKING_URL` | Calendly/Cal.com embed + button URL. |
| `CRM_WEBHOOK_URL` | (optional) outbound webhook on lead capture. |
| `RESULT_VIDEO_ALL_OR_NOTHING` / `_STUCK_LOOP` / `_OVERWHELMED` / `_LOST_HERSELF` | Per-result video URL (YouTube watch URL is auto-converted). |
| `TRAINING_VIDEO_URL` | Single video used for `/training/:slug`. |

Frontend (`artifacts/nu-birth-fitness`):

| Variable | Purpose |
| --- | --- |
| `VITE_YOUTUBE_API_KEY` | (existing) channel/video data. |
| `VITE_GA4_MEASUREMENT_ID` | (optional) GA4. |
| `VITE_META_PIXEL_ID` | (optional) Meta Pixel. |

## Booking webhook

Point your booking provider (Calendly / Cal.com / etc.) at:

```
POST {PUBLIC_SITE_URL}/api/webhooks/booking
```

The handler reads `email` from the JSON payload (also accepts
`invitee_email`, `payload.email`, `contact.email`). It returns
`{ ok: true, matched: false }` (HTTP 202) when there's no matching lead so
your provider doesn't retry forever.

**Signature verification** — when `BOOKING_WEBHOOK_SECRET` is set, the
endpoint requires an `x-booking-signature` (or `x-webhook-signature`) header
containing the hex HMAC-SHA256 of the raw JSON body using that secret. When
the secret is unset, the endpoint accepts unauthenticated calls and logs a
warning — set the secret for production.

## Email compliance

Every nurture email includes:

- A physical mailing address (`MAILING_ADDRESS` env var, CAN-SPAM
  requirement).
- A one-click unsubscribe link backed by `GET /api/unsubscribe?token=<token>`.
  Clicking it sets `leads.unsubscribed = true`, halts every active sequence
  for that lead, and stops all future sends from the scheduler.
- The medical/results-vary disclaimer.

The unsubscribe token is generated at lead-capture time and stored in
`leads.unsubscribe_token`.

## Scheduler concurrency

`processDueSequences()` claims rows atomically using `UPDATE ... SET status =
'sending' WHERE id IN (SELECT ... FOR UPDATE SKIP LOCKED)`. Two concurrent
ticks (or instances) cannot select the same row, which prevents duplicate
sends. Successful sends advance to the next step and reset the row to
`active`; a halted/booked/unsubscribed lead transitions the row to
`halted_booked` / `unsubscribed`.

## CSV export

Admin → "Export CSV" hits `/api/admin/funnel/export.csv` (cookie-gated).
Includes id, name, email, phone, result type, status, tags, UTM, referrer,
device, booked_at, created_at.

## Troubleshooting

- **"Admin not configured"** — set `ADMIN_PASSWORD` and restart the API server.
- **Emails not sending** — check the API server log for `[mail:dev]` entries
  (means Resend isn't configured) or for Resend errors.
- **Result page shows "Video coming soon"** — set the per-result
  `RESULT_VIDEO_*` env vars and restart.
- **Quiz session reset** — funnel state lives in `localStorage` under
  `nubf-funnel-v1`. Clearing it resets the quiz.
