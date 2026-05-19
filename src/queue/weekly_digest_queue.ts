import { Queue } from "bullmq";
import { redisConnection } from "../config/redis_config";

export const weeklyDigestQueue = new Queue("weekly-digest", {
  connection: redisConnection,
});
