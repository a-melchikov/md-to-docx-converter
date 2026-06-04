import type { FastifyInstance } from "fastify";

import { registerConfigRoutes } from "./config.routes.js";
import { registerConvertRoutes } from "./convert.routes.js";
import { registerHealthRoutes } from "./health.routes.js";
import { registerPreviewRoutes } from "./preview.routes.js";

export async function registerApiRoutes(app: FastifyInstance): Promise<void> {
  await app.register(registerHealthRoutes, { prefix: "/api/v1" });
  await app.register(registerConfigRoutes, { prefix: "/api/v1" });
  await app.register(registerPreviewRoutes, { prefix: "/api/v1" });
  await app.register(registerConvertRoutes, { prefix: "/api/v1" });
}
