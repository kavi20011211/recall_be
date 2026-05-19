import cron from "node-cron";
import { db } from "../config/db_config";
import { weeklyDigestQueue } from "../queue/weekly_digest_queue";

export const startWeeklyDigestJob = () => {
  cron.schedule(
    "0 8 * * MON",
    async () => {
      try {
        console.info("Running weekly digest job");

        const [rows]: any = await db.execute(`
          SELECT *
          FROM weekly_digest_data
        `);

        if (!rows || rows.length === 0) {
          console.info("No merchants found for weekly digest");
          return;
        }

        for (const merchant of rows) {
          await weeklyDigestQueue.add(
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
        }

        console.info(`Queued ${rows.length} weekly digest jobs`);
      } catch (error) {
        console.error("Weekly digest cron failed:", error);
      }
    },
    {
      timezone: "America/Toronto",
    },
  );
};
