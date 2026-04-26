# NU Birth Fitness — Client Handoff

Welcome to your finished site. This document walks you through how everything works so you can run it day-to-day with confidence. It is meant to be read top-to-bottom in about 10 minutes. No code, no jargon — just what you need to operate the site, see your leads, and know what to do when things happen.

Throughout this doc, you'll see `https://your-site.com` as a placeholder. Once your real production domain is live, swap that in everywhere you see it.

---

## 1. What you have

Two things, working together:

1. **The public site** — a training video library plus the *Reset Trap Quiz* funnel that turns visitors into booked Reset Calls.
2. **A private admin dashboard** — where you see every lead, what they answered, what emails they've received, and export them to a spreadsheet.

A visitor's journey, in one sentence:
> A mom lands on the quiz, answers 9 questions, gets her "mom type," receives a personalized 10-day email series, and is invited to book a Reset Call — and the moment she books, all the emails automatically stop.

---

## 2. The public site at a glance

Your visitors can reach these pages:

| Page | URL | What it does |
|---|---|---|
| Home | `https://your-site.com/` | The main landing page — featured video and entry into the library. |
| Video library | `https://your-site.com/videos` | Browse every training video. |
| A single video | `https://your-site.com/videos/<id>` | Watch one video, see related ones. |
| Playlists | `https://your-site.com/playlists` | Curated collections (postpartum, strength, etc.). |
| One playlist | `https://your-site.com/playlists/<id>` | All the videos in that collection. |
| Search | `https://your-site.com/search` | Search across the whole library. |
| Favorites | `https://your-site.com/favorites` | Each visitor's saved videos (saved on their device). |
| About | `https://your-site.com/about` | Your story and credentials. |

The library pulls from your YouTube channel, so anything you publish on YouTube can be added without a code change. (See "Adding a new video" at the end.)

---

## 3. The Reset Trap Quiz funnel — step by step

This is the conversion engine. It's a separate flow living inside the same site.

### Step 1 — The quiz landing page
- URL: `https://your-site.com/reset-trap-quiz`
- Also reachable from these short URLs (great for ads or printed materials): `/reset`, `/mom-quiz`, `/start`
- A short, encouraging page that explains what the quiz is and why it's worth 60 seconds.
- Visitor clicks **Take the Quiz**.

### Step 2 — The quiz itself
- URL: `https://your-site.com/quiz`
- Nine multiple-choice questions. Each answer is silently scored toward one of the four "mom types."
- Progress saves on the visitor's device, so refreshing won't lose answers.

### Step 3 — Lead capture
- URL: `https://your-site.com/quiz/contact`
- After the last question, the visitor is asked for **first name + email** (phone optional). They must check a consent box to receive emails.
- The moment they submit, three things happen automatically:
  1. The lead is saved to your database.
  2. **You** get an email saying "New lead: [name] — [their mom type]" with a direct link to the dashboard.
  3. The visitor's personalized 10-day email series starts and the first email is sent immediately.

### Step 4 — The result page (one of four)
The visitor is sent to one of these four pages based on their answers:

| Mom type | URL |
|---|---|
| The All-or-Nothing Mom | `https://your-site.com/results/all-or-nothing` |
| The Stuck-in-the-Loop Mom | `https://your-site.com/results/stuck-in-the-loop` |
| The Overwhelmed Mom | `https://your-site.com/results/overwhelmed` |
| The Lost-Herself Mom | `https://your-site.com/results/lost-herself` |

Each result page shows:
- Their personalized headline and short explanation.
- A **personalized training video** for their type (you set these — see Section 7).
- Two buttons:
  - **"I'm Ready Now — Book My Reset Call"** → goes to the booking page.
  - **"Watch the Free Training Instead"** → goes to a longer training page if they're not ready to book yet.

### Step 5 — The booking page
- URL pattern: `https://your-site.com/book/<their-type>` (e.g. `/book/all-or-nothing`)
- Shows a short intake form (biggest struggle, 90-day goal, what they've tried, best phone/time, etc.).
- After they submit the intake, the **"Open Scheduler"** button opens your scheduling tool in a new tab.
- When they pick a time and confirm, your scheduling tool tells our system, and:
  - The lead is marked **Booked**.
  - All remaining nurture emails for this person stop instantly.
  - **You** get a "Booked: [name]" email.

### Step 6 — The training page (the "not ready yet" path)
- URL pattern: `https://your-site.com/training/<their-type>`
- Plays a longer training video and shows three personalized takeaways for their mom type.
- Has the same **Book My Reset Call** button at the bottom.

---

## 4. Email nurture — what gets sent and when

Every lead is automatically enrolled in two back-to-back email series. Both stop the moment the lead books a call or unsubscribes.

### Series A — The 10-Day Result Series (11 emails)
Starts the moment a lead is captured. One email per day.

| Day | What it covers |
|---|---|
| 0 | "Your quiz result" — confirms their mom type. |
| 1 | "Why you keep starting over." |
| 2 | "The real reason motivation fades." |
| 3 | "One small reset task" (assigns one tiny action). |
| 4 | "The pattern that keeps you stuck." |
| 5 | "A realistic transformation story." |
| 6 | "What can change in 90 days." |
| 7 | "Invitation to book a Reset Call." |
| 8 | "What if you're nervous?" |
| 9 | "The cost of waiting." |
| 10 | "Final invite before the Mom Reset series." |

### Series B — The 5-Day Mom Reset Series (5 emails)
Automatically begins the day after Series A finishes — but only if the lead hasn't booked or unsubscribed.

| Day | What it covers |
|---|---|
| 1 | Reset your morning. |
| 2 | Reset your meals. |
| 3 | Reset your movement. |
| 4 | Reset your mindset. |
| 5 | Final invitation: go further with the 3-Month Bootcamp. |

### How emails actually go out
- The first email of the Result Series is sent immediately when the lead signs up. Every email after that is queued for the next day, and a scheduler runs in the background every hour to send any emails that have come due.
- Each email is **personalized** by mom type and uses the lead's first name.
- The "Book My Reset Call" button in every email goes to your scheduling tool.
- Every email includes an **Unsubscribe** link in the footer, plus your business mailing address (CAN-SPAM compliance).

### What automatically stops the emails
- The lead **books a call** (via your scheduling tool, or you mark them booked in the dashboard).
- The lead **clicks the unsubscribe link** in any email.
- You manually mark them booked from the admin dashboard.

> **Where do the email templates live?** They are stored in the system database and were seeded with the default copy at launch. The final body copy is being written separately and will be loaded in before launch (see "Status of pending items" at the end).

---

## 5. The booking flow — how a confirmed booking flows back

Plain-English version of what happens when a lead clicks **Book My Reset Call**:

1. Lead lands on `/book/<their-type>`, fills the short intake form, hits submit.
2. The intake answers are saved to the lead's record so you can see them in the dashboard.
3. **Open Scheduler** button opens your scheduling tool (Calendly, Cal.com, or similar) in a new tab, with their name and email pre-filled.
4. Lead picks a time and confirms in the scheduling tool.
5. Your scheduling tool sends a small notification (a "webhook") to our system at `https://your-site.com/api/webhooks/booking`.
6. Our system finds the lead by email, marks them **Booked**, halts every pending email, and notifies you.

> **What you need from your scheduling tool:** the ability to send a webhook to our endpoint when a booking is confirmed, including the booker's email. Most modern scheduling tools support this. Setup of the actual scheduling tool and the webhook secret is being handled separately at launch (see "Status of pending items").

---

## 6. The admin dashboard — your daily operations hub

### How to get there
- URL: `https://your-site.com/admin/funnel`
- Enter your admin password (set at launch; you control this).
- The login persists for 30 days on each device you sign in from.

### What you can do there

**See your numbers (the stats panel)**
- How many people started the quiz, finished it, became leads, and booked.
- Your overall conversion rate (leads → booked calls).
- A breakdown by mom type so you can see which types convert best.

**Browse leads**
- A list of every lead, newest first.
- Click any lead to open their full profile.

**Inspect a single lead**
You'll see:
- Name, email, phone, mom type, when they signed up.
- **Their quiz answers** — every question and the option they picked.
- **Their intake form answers** — biggest struggle, 90-day goal, etc.
- **Their email history** — every email sent to them, when, and whether it succeeded.
- **Their event timeline** — every page they viewed, every button they clicked, every milestone.

**Take action on a lead**
- **Mark Booked** — manually flips a lead to Booked, halts their emails, and sends you the booking notification (use this when someone books outside the normal flow, e.g. by phone).

**Export everything**
- One-click CSV download of every lead with name, email, phone, mom type, status, source/UTM tags, and dates. Open it in Excel or Google Sheets.

---

## 7. Links & credentials checklist

Keep this table somewhere safe. Anything marked **Pending** is being finalized at launch and will be filled in then.

| What | Where it lives | Who owns it |
|---|---|---|
| Production site URL | `https://your-site.com` (your final domain) | **You** — your domain registrar |
| Admin dashboard | `https://your-site.com/admin/funnel` | **You** — set the admin password at launch |
| Unsubscribe link pattern | `https://your-site.com/api/unsubscribe?token=...` (auto-included in every email) | System-managed |
| Owner notification email | The address that receives "new lead" + "booked" notifications | **You** — provide at launch |
| Scheduling tool (Calendly / Cal.com / etc.) | The booking link visitors are sent to | **You** — your scheduling tool account. *Pending: real scheduler hookup.* |
| Email-sending account (Resend) | The service that sends nurture emails on your behalf | **You** — Resend account + verified sending domain. *Pending: production keys.* |
| Email "From" address | e.g. `Nu-Birth Fitness <hello@your-site.com>` | **You** — must be on a domain you own and have verified in Resend |
| Business mailing address | Shown in every email footer (CAN-SPAM requires it) | **You** — provide at launch |
| Google Analytics 4 | Dashboard at `analytics.google.com` | **You** — your GA4 property |
| Meta (Facebook) Pixel | Dashboard at `business.facebook.com/events_manager` | **You** — your Meta Pixel |
| Booking webhook secret | A shared password between your scheduling tool and our site | Developer-managed at launch. *Pending.* |
| Database & hosting | Where the leads and email history live | Developer-managed |

### Status of pending items
A few items depend on choices you'll make at go-live, and are being handled separately:
- **Hooking the booking page up to a real scheduling tool** — once you've picked Calendly, Cal.com, or another tool, your developer drops that link into the system configuration and wires up the webhook.
- **Loading the final email body copy** — the email series uses placeholder copy until the final 10-day and 5-day copy is loaded.
- **Setting the production credentials** — real Resend keys, your domain, your admin password, your owner email, your mailing address, and the booking webhook secret get set at launch so the funnel can actually go live.

---

## 8. Day-to-day operations: what to do when…

### …a new lead comes in
- You'll get an email titled `[NU Birth] New lead: <name> — <mom type>`.
- Click the **Open admin dashboard** link in that email to see her quiz answers and history.
- Nothing else is required — she's already enrolled in the email series.

### …someone books a Reset Call
- You'll get an email titled `[NU Birth] Booked: <name>`.
- Her record in the dashboard now shows **Booked** and her remaining emails are already paused.
- Show up to the call. That's it.

### …someone books outside the normal flow (e.g. they call you)
- Open the dashboard, find the lead, click **Mark Booked**.
- That stops her emails and logs the booking just like the automatic flow would.

### …someone asks to unsubscribe
- The fastest path: ask them to click the **Unsubscribe** link at the bottom of any email they've received from you. That's instant and self-serve.
- If they can't find it, you can mark them Booked in the dashboard as a workaround — that also halts their emails. Heads up: doing this counts them as a booked call in your stats, so prefer the unsubscribe link when you can.

### …you want to pause emails for one specific person
- Mark them Booked in the dashboard. That's the cleanest way today. Same caveat: it will count toward your booked-call totals, so use sparingly until the dedicated "pause emails" button lands.

### …you want to add a new video to the library
- Upload it to your YouTube channel as you normally would.
- It will appear in the library automatically (the site reads from your channel). Featuring a specific YouTube video on one of the four result pages, or swapping the longer training video on `/training/<type>`, is currently a developer-managed change — send your developer the YouTube URL and the mom type and they'll swap it in.

### …you want to change the scheduling tool URL
- This is currently a developer-managed change. Send your developer the new scheduling link and they'll swap it in. (A self-serve settings panel is on the roadmap.)

### …you want to download all your leads
- Open the admin dashboard → click **Export CSV**. Opens in Excel or Google Sheets.

### …something looks broken or an email didn't go out
- Open the lead's profile in the dashboard and check the **email history** — each send shows whether it succeeded or errored. If you see consistent errors, contact your developer with the lead's email address so they can investigate.

---

## 9. Quick answers to the questions you'll be asked

- **Where do leads go?** Into the admin dashboard at `/admin/funnel`, and you also get a "new lead" email for each one.
- **What emails get sent and when?** The 10-day Result Series starts the moment they sign up (one email per day for 11 days), then the 5-day Mom Reset Series begins automatically the day after. Booking or unsubscribing stops everything immediately.
- **How do I see my leads?** `/admin/funnel`, log in, click any lead.
- **How do I stop emails for someone?** Either they click unsubscribe in any email, or you mark them Booked in the dashboard.
- **What do I need to keep paying for?** Your domain, your Resend account, your scheduling tool, and your hosting. Google Analytics and Meta Pixel are free.

---

That's everything you need to run the site. Welcome to launch.
