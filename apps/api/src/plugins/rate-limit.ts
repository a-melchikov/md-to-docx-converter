import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";

import type { ApiEnv } from "../config/env.js";

export async function registerRateLimitPlugin(
  app: FastifyInstance,
  config: ApiEnv
): Promise<void> {
  await app.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitTimeWindow
  });
}
