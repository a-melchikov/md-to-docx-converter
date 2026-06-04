import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest
} from "fastify";

import { validateConfigController } from "../controllers/config.controller.js";

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

function requireJsonContentType(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (error?: Error) => void
): void {
  if (isJsonContentType(request.headers["content-type"])) {
    done();
    return;
  }

  reply.status(415).send({
    error: {
      code: "request.unsupportedMediaType",
      message: "Content-Type запроса должен быть application/json.",
      requestId: request.id
    }
  });
}

function isJsonContentType(contentType: string | undefined): boolean {
  if (contentType === undefined) {
    return false;
  }

  const [mediaType] = contentType.split(";", 1);
  const normalized = mediaType?.trim().toLowerCase();

  return normalized === "application/json" || normalized?.endsWith("+json") === true;
}
