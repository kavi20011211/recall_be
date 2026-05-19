import { Worker } from "bullmq";
import { redisConnection } from "../config/redis_config";
import { sendMessage } from "../config/twilio_configs";

export const weeklyDigestWorker = new Worker(
  "weekly-digest",
  async (job) => {
    const {
      merchant_name,
      merchant_phone,
      reminders_sent_last_7_days,
      customers_who_returned,
      total_customers,
      customers_with_reminders_due_next_7_days,
    } = job.data;

    const message = `
Hello ${merchant_name},

Weekly Summary:

- Reminders Sent: ${reminders_sent_last_7_days}
- Returning Customers: ${customers_who_returned}
- Total Customers: ${total_customers}
- Upcoming Reminders: ${customers_with_reminders_due_next_7_days}

Thank you for using Recall!
    `;

    const isSent = await sendMessage(message, merchant_phone);

    if (!isSent) {
      throw new Error("Failed to send weekly digest SMS");
    }

    console.info(`Weekly digest sent to ${merchant_phone}`);
  },
  {
    connection: redisConnection,
    concurrency: 2,
  },
);

weeklyDigestWorker.on("failed", (job, err) => {
  console.error(
    `Weekly digest failed for ${job?.data?.merchant_phone}:`,
    err.message,
  );
});
