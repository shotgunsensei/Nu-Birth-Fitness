# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

The primary product is the **NU-Birth Fitness** PWA (`artifacts/nu-birth-fitness`), a YouTube-powered training site for moms, plus a **Reset Trap Quiz** funnel that captures and nurtures leads through a personalized "mom type" experience.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec) — not used by the funnel routes (they use a thin typed `fetch` client in `src/funnel/api.ts` instead)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React 18 + Vite + wouter + zustand + react-query + framer-motion + Tailwind + shadcn/ui

## Artifacts

- `artifacts/nu-birth-fitness` — main web app (Home, Videos, Playlists, Search, Favorites, About, PWA install) + Reset Trap Quiz funnel pages.
- `artifacts/api-server` — Express API mounted at `/api`. Hosts funnel routes, admin dashboard endpoints, email scheduler.
- `artifacts/mockup-sandbox` — design preview server (canvas).

## Reset Trap Quiz funnel

End-to-end conversion funnel inside the NU-Birth app. See `FUNNEL_NOTES.md` for full operations details.

- **Frontend routes**: `/reset-trap-quiz`, `/quiz`, `/quiz/contact`, `/results/:slug`, `/book/:slug`, `/training/:slug`, `/admin/funnel`.
- **Slugs**: `all-or-nothing`, `stuck-in-the-loop`, `overwhelmed`, `lost-herself`. The DB stores snake_case (`all_or_nothing`, `stuck_loop`, `overwhelmed`, `lost_herself`); the slug ↔ type mapping lives in `src/funnel/types.ts`.
- **Quiz state**: `zustand` + `localStorage` (`nubf-funnel-v1`).
- **Tracking**: `src/funnel/track.ts` fires GA4 + Meta Pixel + internal `/api/events` for everything.
- **Email nurture**: 11-step result series chained into a 5-step Mom Reset series; halts on booking. Hourly scheduler in `lib/scheduler.ts`. Mailer in `lib/mailer.ts` (Resend with console fallback).
- **Admin dashboard**: `/admin/funnel`, password gate via `ADMIN_PASSWORD`, HMAC cookie via `SESSION_SECRET`.
- **Booking webhook**: `POST /api/webhooks/booking` with `email` field — flips lead to `booked`, halts sequences, notifies owner.

## Database

Funnel schema lives in `lib/db/src/schema/funnel.ts`:

- `funnel_leads`, `funnel_quiz_submissions`, `funnel_quiz_answers`, `funnel_lead_events`, `funnel_email_sequences`, `funnel_email_messages`, `funnel_email_logs`, `funnel_booking_intakes`, `funnel_settings`.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/nu-birth-fitness run dev` — run web app locally

## Environment variables

See `.env.example` and `FUNNEL_NOTES.md` for the full list. The app runs without any of the optional vars set (emails fall back to console log; admin returns "not configured" until `ADMIN_PASSWORD` is set).

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
