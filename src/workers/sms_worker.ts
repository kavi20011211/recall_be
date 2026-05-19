import { Worker } from "bullmq";
import { redisConnection } from "../config/redis_config";
import { sendMessage } from "../config/twilio_configs";
import { db } from "../config/db_config";

export const smsWorker = new Worker(
  "sms-reminders",

  async (job) => {
    const { visit_id, first_name, phone_number, service_type } = job.data;

    const message = `
Hi ${first_name || "Customer"},
Your ${service_type} service reminder is due today.
Please visit us again. Thank you!
*reply "STOP" to stop the reminder.
    `;

    const isSuccess = await sendMessage(message, phone_number);

    if (!isSuccess) {
      throw new Error("SMS sending failed");
    }

    await db.execute(
      `
      UPDATE visits
      SET sms_sent = TRUE,
          sms_sent_at = NOW(),
          sms_failure_reason = NULL
      WHERE id = ?
      `,
      [visit_id],
    );

    console.info(`SMS sent to ${phone_number}`);
  },

  {
    connection: redisConnection,
    concurrency: 5,
  },
);

smsWorker.on("failed", async (job, err) => {
  console.error(`Job failed for ${job?.data.phone_number}:`, err.message);

  await db.execute(
    `
    UPDATE visits
    SET sms_failure_reason = ?
    WHERE id = ?
    `,
    [err.message, job?.data.visit_id],
  );
});
