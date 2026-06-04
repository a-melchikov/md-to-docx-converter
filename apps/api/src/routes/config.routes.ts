import type { FastifyInstance } from "fastify";

import { validateConfigController } from "../controllers/config.controller.js";
import { requireJsonContentType } from "../validation/json-content-type.js";

export async function registerConfigRoutes(
  app: FastifyInstance
): Promise<void> {
  app.post(
    "/configs/validate",
    {
      preValidation: requireJsonContentType
    },
    validateConfigController
  );
}
