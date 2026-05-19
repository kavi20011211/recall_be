import { Queue } from "bullmq";
import { redisConnection } from "../config/redis_config";

export const smsQueue = new Queue("sms-reminders", {
  connection: redisConnection,
});
