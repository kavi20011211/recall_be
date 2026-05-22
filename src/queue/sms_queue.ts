import { Queue } from "bullmq";
import { redisConnection } from "../config/redis_config";

export const smsQueue = new Queue("sms-reminders", {
  connection: redisConnection,
});

smsQueue.on("error", (err) => {
  console.error("[sms-queue] Queue error:", err.message);
});

console.info("[sms-queue] Queue initialized");
