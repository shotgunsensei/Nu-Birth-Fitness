import { logger } from "./logger";
import { env, emailEnabled } from "./env";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface MailProvider {
  name: string;
  send(params: SendEmailParams): Promise<{ ok: boolean; error?: string }>;
}

class ResendProvider implements MailProvider {
  name = "resend";
  async send(p: SendEmailParams) {
    if (!env.resendApiKey || !env.emailFrom) {
      return { ok: false, error: "RESEND_API_KEY or EMAIL_FROM not set" };
    }
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${env.resendApiKey}`,
        },
        body: JSON.stringify({
          from: env.emailFrom,
          to: p.to,
          subject: p.subject,
          html: p.html,
          text: p.text,
        }),
      });
      if (!r.ok) {
        const text = await r.text();
        return { ok: false, error: `${r.status}: ${text.slice(0, 300)}` };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}

class ConsoleProvider implements MailProvider {
  name = "console";
  async send(p: SendEmailParams) {
    logger.info({ to: p.to, subject: p.subject }, "[mail:dev] would send email");
    return { ok: true };
  }
}

let provider: MailProvider | null = null;
export function getMailProvider(): MailProvider {
  if (provider) return provider;
  provider = emailEnabled() ? new ResendProvider() : new ConsoleProvider();
  return provider;
}

export function setMailProvider(p: MailProvider) {
  provider = p;
}

export async function sendEmail(params: SendEmailParams) {
  return getMailProvider().send(params);
}
