import { Worker } from "bullmq";
import { redisConnection } from "../config/redis_config";
import { sendMessage } from "../config/twilio_configs";
import { db } from "../config/db_config";

export const smsWorker = new Worker(
  "sms-reminders",

  async (job) => {
    const { visit_id, first_name, phone_number, service_type } = job.data;
    console.info(`[sms-worker] Processing job ${job.id} | visit_id=${visit_id} phone=${phone_number} attempt=${job.attemptsMade + 1}`);

    const message = `
Hi ${first_name || "Customer"},
Your ${service_type} service reminder is due today.
Please visit us again. Thank you!
*reply "STOP" to stop the reminder.
    `;

    console.info(`[sms-worker] Sending SMS to ${phone_number}`);
    const isSuccess = await sendMessage(message, phone_number);

    if (!isSuccess) {
      console.error(`[sms-worker] Twilio returned failure for ${phone_number} (job ${job.id})`);
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

    console.info(`[sms-worker] Job ${job.id} complete — SMS sent to ${phone_number}, visit ${visit_id} marked`);
  },

  {
    connection: redisConnection,
    concurrency: 5,
  },
);

smsWorker.on("active", (job) => {
  console.info(`[sms-worker] Job ${job.id} active | phone=${job.data.phone_number}`);
});

smsWorker.on("completed", (job) => {
  console.info(`[sms-worker] Job ${job.id} completed successfully`);
});

smsWorker.on("failed", async (job, err) => {
  console.error(`[sms-worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts?.attempts}) for phone=${job?.data.phone_number}: ${err.message}`);

  await db.execute(
    `
    UPDATE visits
    SET sms_failure_reason = ?
    WHERE id = ?
    `,
    [err.message, job?.data.visit_id],
  );
});

smsWorker.on("error", (err) => {
  console.error("[sms-worker] Worker error:", err.message);
});

console.info("[sms-worker] Worker started, listening on sms-reminders queue");
