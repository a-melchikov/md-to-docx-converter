import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";

import type { ApiEnv } from "../config/env.js";

export async function registerCorsPlugin(
  app: FastifyInstance,
  config: ApiEnv
): Promise<void> {
  await app.register(cors, {
    origin: config.corsOrigin
  });
}
