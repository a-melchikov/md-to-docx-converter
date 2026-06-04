import type { FastifyInstance } from "fastify";

import { registerHealthRoutes } from "./health.routes.js";

export async function registerApiRoutes(app: FastifyInstance): Promise<void> {
  await app.register(registerHealthRoutes, { prefix: "/api/v1" });
}
