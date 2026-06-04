import type { FastifyInstance } from "fastify";

import { convertController } from "../controllers/convert.controller.js";
import { requireJsonContentType } from "../validation/json-content-type.js";
import { MAX_CONVERT_JSON_BODY_BYTES } from "../validation/convert-request.validation.js";

export async function registerConvertRoutes(
  app: FastifyInstance
): Promise<void> {
  app.post(
    "/convert",
    {
      bodyLimit: MAX_CONVERT_JSON_BODY_BYTES,
      preValidation: requireJsonContentType
    },
    convertController
  );
}
