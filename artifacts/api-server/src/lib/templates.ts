import type { ResultType, SequenceType } from "@workspace/db";

interface Template {
  subject: string;
  body: string;
}

const RESULT_LABEL: Record<ResultType, string> = {
  all_or_nothing: "the All-or-Nothing Mom",
  stuck_loop: "the Stuck-in-the-Loop Mom",
  overwhelmed: "the Overwhelmed Mom",
  lost_herself: "the Lost-Herself Mom",
};

const RESULT_HEADLINE: Record<ResultType, string> = {
  all_or_nothing: "You're the All-or-Nothing Mom",
  stuck_loop: "You're the Stuck-in-the-Loop Mom",
  overwhelmed: "You're the Overwhelmed Mom",
  lost_herself: "You're the Lost-Herself Mom",
};

const RESULT_BLURB: Record<ResultType, string> = {
  all_or_nothing:
    "You don't lack discipline. You've been trying to win with a plan that only works when life is perfect. The fix is rhythm and flexibility, not punishment.",
  stuck_loop:
    "You're not new to trying. The cycle keeps repeating because it's a pattern issue, not a motivation issue. The goal is breaking the loop completely.",
  overwhelmed:
    "You're carrying too much, and your body has been pushed to the bottom of the list. You don't need a complicated plan. You need a simple system that fits inside real mom life.",
  lost_herself:
    "This is deeper than weight. The reset isn't just about a smaller body — it's about getting your energy, confidence, and identity back.",
};

function shell(opts: {
  firstName: string;
  bookingUrl: string;
  resultType: ResultType;
  intro: string;
  body: string;
  ctaLabel?: string;
  unsubscribeUrl: string;
}): Template {
  const { firstName, bookingUrl, resultType, intro, body, ctaLabel = "Book My Reset Call", unsubscribeUrl } = opts;
  const headline = RESULT_HEADLINE[resultType];
  const senderAddress = process.env.MAILING_ADDRESS?.trim() ?? "";
  const html = `<!doctype html>
<html><body style="font-family:Helvetica,Arial,sans-serif;color:#2b2622;background:#fbf9f4;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #efe8db;">
    <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px;">${headline}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Hi ${firstName},</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">${intro}</p>
    <div style="font-size:15px;line-height:1.7;margin:0 0 24px;">${body}</div>
    <p style="text-align:center;margin:28px 0;">
      <a href="${bookingUrl}" style="background:#7a9b7a;color:#fff;text-decoration:none;padding:14px 24px;border-radius:999px;display:inline-block;font-weight:600;">${ctaLabel}</a>
    </p>
    <p style="font-size:12px;color:#888;line-height:1.5;margin:24px 0 0;border-top:1px solid #efe8db;padding-top:16px;">
      Results vary. Nu-Birth Fitness provides coaching and educational guidance, not medical advice. Consult your healthcare provider before beginning a new fitness or nutrition program.
    </p>
    <p style="font-size:12px;color:#888;line-height:1.5;margin:12px 0 0;text-align:center;">
      You're receiving this because you took the Reset Trap Quiz at Nu-Birth Fitness.<br/>
      ${senderAddress ? `${senderAddress}<br/>` : ""}
      <a href="${unsubscribeUrl}" style="color:#888;text-decoration:underline;">Unsubscribe</a>
    </p>
  </div>
</body></html>`;
  return { subject: "", body: html };
}

const TEN_DAY_TITLES = [
  "Your Quiz Result",
  "Why You Keep Starting Over",
  "The Real Reason Motivation Fades",
  "One Small Reset Task",
  "The Pattern That Keeps You Stuck",
  "A Realistic Transformation Story",
  "What Can Change in 90 Days",
  "Invitation to Book a Reset Call",
  "What If You're Nervous?",
  "The Cost of Waiting",
  "Final Invite Before the Mom Reset Series",
];

const FIVE_DAY_TITLES = [
  "Reset Your Morning",
  "Reset Your Meals",
  "Reset Your Movement",
  "Reset Your Mindset",
  "Go Further With the 3-Month Bootcamp",
];

function tenDayBody(step: number, resultType: ResultType): string {
  const blurb = RESULT_BLURB[resultType];
  const map: Record<number, string> = {
    0: `Your result is in: <strong>${RESULT_LABEL[resultType]}</strong>. ${blurb}`,
    1: "Most resets fail because they restart the same broken cycle. The reset that lasts breaks the pattern instead of repeating it.",
    2: "Motivation fades by design. The plan you can keep on a hard day is the plan that actually works.",
    3: "Today, do one tiny reset: drink 16 oz of water before coffee, walk 10 minutes after lunch, or get to bed 20 minutes earlier. Pick one.",
    4: "What keeps you stuck isn't lack of effort — it's the pattern your week is built on. Change the pattern, change the result.",
    5: "I want to show you what realistic, mom-life-friendly progress actually looks like. No transformation pic theatrics — just real, sustainable change.",
    6: "Ninety days is enough to feel different in your jeans, your energy, and how you walk into a room. The path is simple, not easy.",
    7: "If you've read this far, you're ready for more than another tip email. Grab a free Reset Call and let's map your next 90 days.",
    8: "Nervous? Good — that means it matters. The call is a calm conversation, not a sales pitch. You decide what's next.",
    9: "Six months from now, you'll be glad you started today. Or you'll be in the same place wishing you had.",
    10: "This is the last note in this series. Tomorrow we move into the 5-Day Mom Reset. If you're ready now, the call link is below.",
  };
  return map[step] ?? blurb;
}

function fiveDayBody(step: number): string {
  const map: Record<number, string> = {
    0: "Tomorrow morning, do these three things before you check your phone: water, stretch, name one thing you're proud of. That's the reset.",
    1: "You don't need a meal plan. You need a meal pattern: protein, color, and a real sit-down for one meal a day.",
    2: "Movement isn't a workout. It's the rhythm your body remembers — 20 minutes, 4x this week, anything that gets your heart up.",
    3: "Mindset isn't toxic positivity. It's deciding in advance how you'll handle the missed day. (You'll start the next one. That's it.)",
    4: "If the past 5 days have felt like something you could actually keep, the 3-Month Bootcamp is the next step. Book a call and let's talk.",
  };
  return map[step] ?? "";
}

export function buildResultTenDayMessage(opts: {
  step: number;
  firstName: string;
  resultType: ResultType;
  bookingUrl: string;
  unsubscribeUrl: string;
}): Template {
  const { step, firstName, resultType, bookingUrl, unsubscribeUrl } = opts;
  const title = TEN_DAY_TITLES[step] ?? "From Nu-Birth Fitness";
  const intro =
    step === 0
      ? `Thanks for taking the Reset Trap Quiz.`
      : `Quick note from Nu-Birth Fitness — Day ${step} of your reset series.`;
  const tpl = shell({
    firstName,
    bookingUrl,
    resultType,
    intro,
    body: tenDayBody(step, resultType),
    unsubscribeUrl,
  });
  tpl.subject = `${title} — ${RESULT_HEADLINE[resultType]}`;
  return tpl;
}

export function buildMomResetMessage(opts: {
  step: number;
  firstName: string;
  resultType: ResultType;
  bookingUrl: string;
  unsubscribeUrl: string;
}): Template {
  const { step, firstName, resultType, bookingUrl, unsubscribeUrl } = opts;
  const title = FIVE_DAY_TITLES[step] ?? "Mom Reset";
  const tpl = shell({
    firstName,
    bookingUrl,
    resultType,
    intro: `Day ${step + 1} of the 5-Day Mom Reset.`,
    body: fiveDayBody(step),
    ctaLabel: step === 4 ? "Book My Reset Call" : "Book My Reset Call",
    unsubscribeUrl,
  });
  tpl.subject = `${title} — Day ${step + 1}`;
  return tpl;
}

export function buildOwnerNewLeadMessage(opts: {
  firstName: string;
  email: string;
  phone: string | null;
  resultType: ResultType;
  siteUrl: string;
}): Template {
  const { firstName, email, phone, resultType, siteUrl } = opts;
  const html = `<!doctype html>
<html><body style="font-family:Helvetica,Arial,sans-serif;color:#222;padding:16px;">
  <h2 style="margin:0 0 12px;">New quiz lead</h2>
  <p style="margin:0 0 8px;"><strong>${firstName}</strong> (${RESULT_HEADLINE[resultType]})</p>
  <p style="margin:0 0 8px;">Email: <a href="mailto:${email}">${email}</a></p>
  ${phone ? `<p style="margin:0 0 8px;">Phone: ${phone}</p>` : ""}
  <p style="margin:16px 0 0;"><a href="${siteUrl}/admin/funnel">Open admin dashboard</a></p>
</body></html>`;
  return { subject: `[NU Birth] New lead: ${firstName} — ${RESULT_HEADLINE[resultType]}`, body: html };
}

export function buildOwnerBookingMessage(opts: {
  firstName: string;
  email: string;
  resultType: ResultType;
  source: string;
  siteUrl: string;
}): Template {
  const { firstName, email, resultType, source, siteUrl } = opts;
  const html = `<!doctype html>
<html><body style="font-family:Helvetica,Arial,sans-serif;color:#222;padding:16px;">
  <h2 style="margin:0 0 12px;">Booking detected</h2>
  <p>${firstName} (${email}) — ${RESULT_HEADLINE[resultType]}</p>
  <p>Source: ${source}</p>
  <p><a href="${siteUrl}/admin/funnel">Open admin dashboard</a></p>
</body></html>`;
  return { subject: `[NU Birth] Booked: ${firstName}`, body: html };
}
