export const env = {
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "",
  ownerEmail: process.env.OWNER_EMAIL ?? "",
  publicSiteUrl: process.env.PUBLIC_SITE_URL ?? "",
  bookingUrl: process.env.BOOKING_URL ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  sessionSecret: process.env.SESSION_SECRET ?? "dev-secret-change-me",
  bookingWebhookSecret: process.env.BOOKING_WEBHOOK_SECRET ?? "",
  mailingAddress: process.env.MAILING_ADDRESS ?? "",
  crmWebhookUrl: process.env.CRM_WEBHOOK_URL ?? "",
  resultVideos: {
    all_or_nothing: process.env.RESULT_VIDEO_ALL_OR_NOTHING ?? "",
    stuck_loop: process.env.RESULT_VIDEO_STUCK_LOOP ?? "",
    overwhelmed: process.env.RESULT_VIDEO_OVERWHELMED ?? "",
    lost_herself: process.env.RESULT_VIDEO_LOST_HERSELF ?? "",
  } as Record<string, string>,
  trainingVideoUrl: process.env.TRAINING_VIDEO_URL ?? "",
};

export function emailEnabled(): boolean {
  return Boolean(env.resendApiKey && env.emailFrom);
}

if (process.env.NODE_ENV === "production") {
  if (!env.mailingAddress) {
    // CAN-SPAM requires a physical postal address in commercial email.
    console.warn("[env] MAILING_ADDRESS is not set — nurture emails will omit a physical address (CAN-SPAM gap).");
  }
  if (env.sessionSecret === "dev-secret-change-me") {
    console.warn("[env] SESSION_SECRET is using the dev fallback — admin auth will refuse to authorize anyone.");
  }
  if (!env.bookingWebhookSecret) {
    console.warn("[env] BOOKING_WEBHOOK_SECRET is not set — /api/webhooks/booking will reject calls in production.");
  }
}
