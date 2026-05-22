import { Worker } from "bullmq";
import { redisConnection } from "../config/redis_config";
import { sendMessage } from "../config/twilio_configs";

export const weeklyDigestWorker = new Worker(
  "weekly-digest",
  async (job) => {
    const {
      merchant_id,
      merchant_name,
      merchant_phone,
      reminders_sent_last_7_days,
      customers_who_returned,
      total_customers,
      customers_with_reminders_due_next_7_days,
    } = job.data;
    console.info(`[weekly-digest-worker] Processing job ${job.id} | merchant_id=${merchant_id} phone=${merchant_phone} attempt=${job.attemptsMade + 1}`);

    const message = `
Hello ${merchant_name},

Weekly Summary:

- Reminders Sent: ${reminders_sent_last_7_days}
- Returning Customers: ${customers_who_returned}
- Total Customers: ${total_customers}
- Upcoming Reminders: ${customers_with_reminders_due_next_7_days}

Thank you for using Recall!
    `;

    console.info(`[weekly-digest-worker] Sending digest SMS to merchant ${merchant_id} (${merchant_phone})`);
    const isSent = await sendMessage(message, merchant_phone);

    if (!isSent) {
      console.error(`[weekly-digest-worker] Twilio returned failure for merchant ${merchant_id} (job ${job.id})`);
      throw new Error("Failed to send weekly digest SMS");
    }

    console.info(`[weekly-digest-worker] Job ${job.id} complete — digest sent to ${merchant_phone} (merchant ${merchant_id})`);
  },
  {
    connection: redisConnection,
    concurrency: 2,
  },
);

weeklyDigestWorker.on("active", (job) => {
  console.info(`[weekly-digest-worker] Job ${job.id} active | merchant=${job.data.merchant_id}`);
});

weeklyDigestWorker.on("completed", (job) => {
  console.info(`[weekly-digest-worker] Job ${job.id} completed successfully`);
});

weeklyDigestWorker.on("failed", (job, err) => {
  console.error(`[weekly-digest-worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts?.attempts}) for merchant=${job?.data?.merchant_id}: ${err.message}`);
});

weeklyDigestWorker.on("error", (err) => {
  console.error("[weekly-digest-worker] Worker error:", err.message);
});

console.info("[weekly-digest-worker] Worker started, listening on weekly-digest queue");
