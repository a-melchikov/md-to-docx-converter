import type { FastifyInstance } from "fastify";

import {
  healthController,
  readinessController
} from "../controllers/health.controller.js";

export async function registerHealthRoutes(
  app: FastifyInstance
): Promise<void> {
  app.get("/health", healthController);
  app.get("/ready", readinessController);
}
