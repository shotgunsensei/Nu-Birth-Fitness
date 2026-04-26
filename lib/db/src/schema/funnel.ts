import {
  pgTable,
  text,
  serial,
  timestamp,
  jsonb,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const RESULT_TYPES = [
  "all_or_nothing",
  "stuck_loop",
  "overwhelmed",
  "lost_herself",
] as const;
export type ResultType = (typeof RESULT_TYPES)[number];

export const SEQUENCE_TYPES = ["result_10day", "mom_reset_5day"] as const;
export type SequenceType = (typeof SEQUENCE_TYPES)[number];

export const leads = pgTable(
  "funnel_leads",
  {
    id: serial("id").primaryKey(),
    firstName: text("first_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    consent: boolean("consent").notNull().default(false),
    resultType: text("result_type").notNull(),
    status: text("status").notNull().default("new"),
    source: text("source"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmContent: text("utm_content"),
    utmTerm: text("utm_term"),
    referrer: text("referrer"),
    deviceType: text("device_type"),
    sessionId: text("session_id"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    bookedAt: timestamp("booked_at"),
    unsubscribed: boolean("unsubscribed").notNull().default(false),
    unsubscribedAt: timestamp("unsubscribed_at"),
    unsubscribeToken: text("unsubscribe_token"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex("funnel_leads_email_idx").on(t.email),
    resultIdx: index("funnel_leads_result_idx").on(t.resultType),
    createdIdx: index("funnel_leads_created_idx").on(t.createdAt),
  }),
);

export type InsertLead = typeof leads.$inferInsert;
export type Lead = typeof leads.$inferSelect;

export const quizSubmissions = pgTable(
  "funnel_quiz_submissions",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    leadId: integer("lead_id"),
    resultType: text("result_type"),
    scoreJson: jsonb("score_json").$type<Record<string, number>>(),
    answersJson: jsonb("answers_json").$type<Record<string, string>>(),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (t) => ({
    sessionIdx: uniqueIndex("funnel_quiz_session_idx").on(t.sessionId),
  }),
);

export type QuizSubmission = typeof quizSubmissions.$inferSelect;

export const quizAnswers = pgTable(
  "funnel_quiz_answers",
  {
    id: serial("id").primaryKey(),
    submissionId: integer("submission_id").notNull(),
    questionKey: text("question_key").notNull(),
    answerKey: text("answer_key").notNull(),
    answerType: text("answer_type").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    subIdx: index("funnel_quiz_answers_sub_idx").on(t.submissionId),
  }),
);

export type QuizAnswer = typeof quizAnswers.$inferSelect;

export const leadEvents = pgTable(
  "funnel_lead_events",
  {
    id: serial("id").primaryKey(),
    leadId: integer("lead_id"),
    sessionId: text("session_id"),
    eventName: text("event_name").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    eventIdx: index("funnel_events_name_idx").on(t.eventName),
    leadIdx: index("funnel_events_lead_idx").on(t.leadId),
  }),
);

export type LeadEvent = typeof leadEvents.$inferSelect;

export const emailSequences = pgTable("funnel_email_sequences", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  sequenceType: text("sequence_type").notNull(),
  resultType: text("result_type"),
  currentStep: integer("current_step").notNull().default(0),
  totalSteps: integer("total_steps").notNull(),
  status: text("status").notNull().default("active"),
  nextSendAt: timestamp("next_send_at"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export type EmailSequence = typeof emailSequences.$inferSelect;

export const emailMessages = pgTable("funnel_email_messages", {
  id: serial("id").primaryKey(),
  sequenceType: text("sequence_type").notNull(),
  resultType: text("result_type"),
  step: integer("step").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
});

export type EmailMessage = typeof emailMessages.$inferSelect;

export const emailLogs = pgTable(
  "funnel_email_logs",
  {
    id: serial("id").primaryKey(),
    leadId: integer("lead_id").notNull(),
    sequenceId: integer("sequence_id"),
    step: integer("step"),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    toEmail: text("to_email").notNull(),
    provider: text("provider").notNull().default("resend"),
    status: text("status").notNull().default("sent"),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at").notNull().defaultNow(),
  },
  (t) => ({
    leadIdx: index("funnel_email_logs_lead_idx").on(t.leadId),
  }),
);

export type EmailLog = typeof emailLogs.$inferSelect;

export const bookingIntakes = pgTable("funnel_booking_intakes", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id"),
  email: text("email").notNull(),
  resultType: text("result_type").notNull(),
  biggestStruggle: text("biggest_struggle"),
  goal90Days: text("goal_90_days"),
  triedBefore: text("tried_before"),
  knockedOff: text("knocked_off"),
  howSoon: text("how_soon"),
  openToCoaching: text("open_to_coaching"),
  bestPhone: text("best_phone"),
  bestTime: text("best_time"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type BookingIntake = typeof bookingIntakes.$inferSelect;

export const settings = pgTable("funnel_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Setting = typeof settings.$inferSelect;
