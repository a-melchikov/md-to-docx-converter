import type { FastifyInstance } from "fastify";

import { htmlPreviewController } from "../controllers/preview.controller.js";
import { requireJsonContentType } from "../validation/json-content-type.js";
import { MAX_PREVIEW_JSON_BODY_BYTES } from "../validation/preview-request.validation.js";

export async function registerPreviewRoutes(
  app: FastifyInstance
): Promise<void> {
  app.post(
    "/preview/html",
    {
      bodyLimit: MAX_PREVIEW_JSON_BODY_BYTES,
      preValidation: requireJsonContentType
    },
    htmlPreviewController
  );
}
