import type { FastifyReply, FastifyRequest } from "fastify";

import { toHtmlPreviewResponse } from "../dto/html-preview.dto.js";
import { renderHtmlPreviewForRequest } from "../services/html-preview.service.js";

export async function htmlPreviewController(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const result = renderHtmlPreviewForRequest(request.body);

  await reply.status(200).send(toHtmlPreviewResponse(result));
}
