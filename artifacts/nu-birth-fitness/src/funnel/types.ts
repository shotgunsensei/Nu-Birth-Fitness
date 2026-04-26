export const RESULT_TYPES = [
  "all_or_nothing",
  "stuck_loop",
  "overwhelmed",
  "lost_herself",
] as const;
export type ResultType = (typeof RESULT_TYPES)[number];

export const RESULT_SLUGS: Record<ResultType, string> = {
  all_or_nothing: "all-or-nothing",
  stuck_loop: "stuck-in-the-loop",
  overwhelmed: "overwhelmed",
  lost_herself: "lost-herself",
};

export const SLUG_TO_TYPE: Record<string, ResultType> = {
  "all-or-nothing": "all_or_nothing",
  "stuck-in-the-loop": "stuck_loop",
  overwhelmed: "overwhelmed",
  "lost-herself": "lost_herself",
};

export interface QuizQuestion {
  key: string;
  question: string;
  options: { key: "A" | "B" | "C" | "D"; label: string; type: ResultType }[];
}

export const QUESTIONS: QuizQuestion[] = [
  {
    key: "Q1",
    question: "When you try to restart your health/fitness routine, what usually happens?",
    options: [
      { key: "A", label: "I go hard for a few days, then crash.", type: "all_or_nothing" },
      { key: "B", label: "I restart the same plan over and over.", type: "stuck_loop" },
      { key: "C", label: "Life gets too chaotic and I fall off.", type: "overwhelmed" },
      { key: "D", label: "I struggle to even recognize what I need anymore.", type: "lost_herself" },
    ],
  },
  {
    key: "Q2",
    question: "Which phrase feels most true right now?",
    options: [
      { key: "A", label: "“If I can’t do it perfectly, I feel like I failed.”", type: "all_or_nothing" },
      { key: "B", label: "“I know what to do, but I keep ending up back here.”", type: "stuck_loop" },
      { key: "C", label: "“Everyone needs something from me all the time.”", type: "overwhelmed" },
      { key: "D", label: "“I don’t feel like myself anymore.”", type: "lost_herself" },
    ],
  },
  {
    key: "Q3",
    question: "What is your biggest obstacle?",
    options: [
      { key: "A", label: "Consistency after motivation fades", type: "all_or_nothing" },
      { key: "B", label: "Breaking old habits and cycles", type: "stuck_loop" },
      { key: "C", label: "Time, stress, kids, family, work", type: "overwhelmed" },
      { key: "D", label: "Energy, confidence, identity, self-worth", type: "lost_herself" },
    ],
  },
  {
    key: "Q4",
    question: "How do you feel when you miss a workout or meal plan?",
    options: [
      { key: "A", label: "Like I ruined everything", type: "all_or_nothing" },
      { key: "B", label: "Like I’m back at square one again", type: "stuck_loop" },
      { key: "C", label: "Like it was impossible anyway", type: "overwhelmed" },
      { key: "D", label: "Like I’m disappointed in who I’ve become", type: "lost_herself" },
    ],
  },
  {
    key: "Q5",
    question: "What kind of plan would help you most?",
    options: [
      { key: "A", label: "A flexible plan that doesn’t punish imperfection", type: "all_or_nothing" },
      { key: "B", label: "A pattern-breaking reset with accountability", type: "stuck_loop" },
      { key: "C", label: "A simple routine that works inside real mom life", type: "overwhelmed" },
      { key: "D", label: "A confidence rebuild that reconnects me to myself", type: "lost_herself" },
    ],
  },
  {
    key: "Q6",
    question: "What best describes your energy?",
    options: [
      { key: "A", label: "Comes in bursts, then crashes", type: "all_or_nothing" },
      { key: "B", label: "Feels stuck in the same cycle", type: "stuck_loop" },
      { key: "C", label: "Drained by responsibilities", type: "overwhelmed" },
      { key: "D", label: "Low because I feel disconnected from myself", type: "lost_herself" },
    ],
  },
  {
    key: "Q7",
    question: "What do you want most in the next 90 days?",
    options: [
      { key: "A", label: "Stop quitting when it isn’t perfect", type: "all_or_nothing" },
      { key: "B", label: "Finally stop starting over", type: "stuck_loop" },
      { key: "C", label: "Lose weight without adding more chaos", type: "overwhelmed" },
      { key: "D", label: "Feel confident, attractive, and alive again", type: "lost_herself" },
    ],
  },
  {
    key: "Q8",
    question: "How ready are you for support?",
    options: [
      { key: "A", label: "I need structure that keeps me from going extreme", type: "all_or_nothing" },
      { key: "B", label: "I need accountability to break the loop", type: "stuck_loop" },
      { key: "C", label: "I need someone to simplify this for my life", type: "overwhelmed" },
      { key: "D", label: "I need someone to help me find myself again", type: "lost_herself" },
    ],
  },
  {
    key: "Q9",
    question: "What happens if nothing changes over the next 6 months?",
    options: [
      { key: "A", label: "I’ll keep repeating the same intense restart/crash cycle", type: "all_or_nothing" },
      { key: "B", label: "I’ll still be stuck in the same loop", type: "stuck_loop" },
      { key: "C", label: "I’ll keep putting myself last", type: "overwhelmed" },
      { key: "D", label: "I’ll feel even further away from who I used to be", type: "lost_herself" },
    ],
  },
];

export const RESULT_META: Record<
  ResultType,
  {
    label: string;
    headline: string;
    short: string;
    primaryCtaSubcopy: string;
    body: string;
  }
> = {
  all_or_nothing: {
    label: "All-or-Nothing Mom",
    headline: "You’re the All-or-Nothing Mom",
    short: "You go hard, then crash. Your reset needs rhythm, not punishment.",
    primaryCtaSubcopy: "Show me how to lose weight without starting over every Monday.",
    body: "You don’t lack discipline. You’ve been trying to win with a plan that only works when life is perfect. You go hard, push fast, expect a full reset overnight, then one missed day feels like failure. Your body does not need punishment. It needs rhythm, flexibility, and a plan that lets you keep going even when the day gets messy.",
  },
  stuck_loop: {
    label: "Stuck-in-the-Loop Mom",
    headline: "You’re the Stuck-in-the-Loop Mom",
    short: "You know the cycle. The goal isn’t another restart — it’s breaking the loop.",
    primaryCtaSubcopy: "Help me finally stop starting over.",
    body: "You’re not new to trying. That’s the frustrating part. You know the cycle. You get motivated, restart, make some progress, then something knocks you off and the same loop starts again. This is not a motivation issue. It’s a pattern issue. The goal is not another restart. The goal is breaking the loop completely.",
  },
  overwhelmed: {
    label: "Overwhelmed Mom",
    headline: "You’re the Overwhelmed Mom",
    short: "Everything cuts the line in front of you. You need a system, not a fantasy schedule.",
    primaryCtaSubcopy: "Help me make this work with my actual life.",
    body: "You’re carrying too much, and your body has been pushed to the bottom of the list. It’s not that you don’t care. It’s that everyone and everything else keeps cutting the line. You do not need a complicated plan. You need a simple system that fits inside real mom life instead of demanding a fantasy schedule you do not have.",
  },
  lost_herself: {
    label: "Lost-Herself Mom",
    headline: "You’re the Lost-Herself Mom",
    short: "This is deeper than weight. The goal is getting your spark and identity back.",
    primaryCtaSubcopy: "Help me feel like myself again.",
    body: "This is deeper than weight. Somewhere between responsibilities, stress, motherhood, and survival mode, you stopped feeling like yourself. The goal is not just a smaller body. The goal is getting your energy, confidence, spark, and identity back. Your reset needs to rebuild the woman, not just change the number on the scale.",
  },
};

export function scoreAnswers(answers: Record<string, ResultType>): {
  scores: Record<ResultType, number>;
  result: ResultType;
} {
  const scores: Record<ResultType, number> = {
    all_or_nothing: 0,
    stuck_loop: 0,
    overwhelmed: 0,
    lost_herself: 0,
  };
  for (const v of Object.values(answers)) {
    if (v) scores[v] = (scores[v] ?? 0) + 1;
  }
  let max = -1;
  let topTypes: ResultType[] = [];
  for (const t of RESULT_TYPES) {
    if (scores[t] > max) {
      max = scores[t];
      topTypes = [t];
    } else if (scores[t] === max) {
      topTypes.push(t);
    }
  }
  if (topTypes.length === 1) return { scores, result: topTypes[0] };
  // Tie-breaker: Q9, then Q8, then Q7
  for (const tieKey of ["Q9", "Q8", "Q7"]) {
    const a = answers[tieKey];
    if (a && topTypes.includes(a)) {
      return { scores, result: a };
    }
  }
  return { scores, result: topTypes[0] };
}
