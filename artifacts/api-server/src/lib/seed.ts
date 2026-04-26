import { db, emailMessages, RESULT_TYPES } from "@workspace/db";
import { sql } from "drizzle-orm";
import { buildResultTenDayMessage, buildMomResetMessage } from "./templates";
import { logger } from "./logger";

export async function seedEmailMessages(): Promise<void> {
  try {
    const existing = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailMessages);
    const total = Number(existing[0]?.count ?? 0);
    if (total > 0) return;

    const rows: Array<{ sequenceType: string; resultType: string | null; step: number; subject: string; body: string }> = [];

    for (const resultType of RESULT_TYPES) {
      for (let step = 0; step < 11; step++) {
        const tpl = buildResultTenDayMessage({
          step,
          firstName: "{{firstName}}",
          resultType,
          bookingUrl: "{{bookingUrl}}",
          unsubscribeUrl: "{{unsubscribeUrl}}",
        });
        rows.push({
          sequenceType: "result_10day",
          resultType,
          step,
          subject: tpl.subject,
          body: tpl.body,
        });
      }
    }
    for (let step = 0; step < 5; step++) {
      const tpl = buildMomResetMessage({
        step,
        firstName: "{{firstName}}",
        resultType: "all_or_nothing",
        bookingUrl: "{{bookingUrl}}",
        unsubscribeUrl: "{{unsubscribeUrl}}",
      });
      rows.push({
        sequenceType: "mom_reset_5day",
        resultType: null,
        step,
        subject: tpl.subject,
        body: tpl.body,
      });
    }

    await db.insert(emailMessages).values(rows);
    logger.info({ count: rows.length }, "[seed] inserted email_messages templates");
  } catch (err) {
    logger.warn({ err }, "[seed] failed to seed email_messages");
  }
}
