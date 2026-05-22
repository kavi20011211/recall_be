import { Queue } from "bullmq";
import { redisConnection } from "../config/redis_config";

export const weeklyDigestQueue = new Queue("weekly-digest", {
  connection: redisConnection,
});

weeklyDigestQueue.on("error", (err) => {
  console.error("[weekly-digest-queue] Queue error:", err.message);
});

console.info("[weekly-digest-queue] Queue initialized");
