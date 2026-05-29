import cron from "node-cron";
import { db } from "../config/db_config";
import { weeklyDigestQueue } from "../queue/weekly_digest_queue";

export const startWeeklyDigestJob = () => {
  console.info("[weekly-digest-service] Cron job registered: runs at 0 8 * * MON (Monday 8 AM America/Toronto)");

  cron.schedule(
    "0 8 * * MON",
    async () => {
      const tickAt = new Date().toISOString();
      console.info(`[weekly-digest-service] Cron tick at ${tickAt} — querying merchants`);

      try {
        const [rows]: any = await db.execute(`
          SELECT *
          FROM weekly_digest_data
        `);

        if (!rows || rows.length === 0) {
          console.info("[weekly-digest-service] No merchants found in weekly_digest_data, skipping queue");
          return;
        }

        console.info(`[weekly-digest-service] Found ${rows.length} merchant(s) to notify`);

        for (const merchant of rows) {
          const job = await weeklyDigestQueue.add(
            "weekly-report",
            {
              merchant_id: merchant.merchant_id,
              merchant_name: merchant.business_name,
              merchant_phone: merchant.owner_phone,

              reminders_sent_last_7_days: merchant.reminders_sent_last_7_days,
              customers_who_returned: merchant.customers_who_returned,
              total_customers: merchant.total_customers,
              customers_with_reminders_due_next_7_days:
                merchant.customers_with_reminders_due_next_7_days,
            },
            {
              jobId: `weekly-${merchant.merchant_id}`,
              attempts: 3,
              backoff: {
                type: "exponential",
                delay: 5000,
              },
              removeOnComplete: true,
            },
          );
          console.info(`[weekly-digest-service] Enqueued job ${job.id} for merchant_id=${merchant.merchant_id} phone=${merchant.owner_phone}`);
        }

        console.info(`[weekly-digest-service] Done — ${rows.length} job(s) added to weekly-digest queue`);
      } catch (error) {
        console.error("[weekly-digest-service] Cron error:", error);
      }
    },
    {
      timezone: "America/Toronto",
    },
  );
};
