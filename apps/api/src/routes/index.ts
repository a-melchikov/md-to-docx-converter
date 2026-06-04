import type { FastifyInstance } from "fastify";

import { registerConfigRoutes } from "./config.routes.js";
import { registerHealthRoutes } from "./health.routes.js";

export async function registerApiRoutes(app: FastifyInstance): Promise<void> {
  await app.register(registerHealthRoutes, { prefix: "/api/v1" });
  await app.register(registerConfigRoutes, { prefix: "/api/v1" });
}
