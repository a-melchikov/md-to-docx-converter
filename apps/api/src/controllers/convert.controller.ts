import type { FastifyReply, FastifyRequest } from "fastify";

import { convertMarkdownToDocx } from "../services/docx-convert.service.js";
import { diagnosticsToHeader } from "../utils/diagnostics-header.js";
import { contentDispositionAttachment } from "../utils/safe-file-name.js";

export async function convertController(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const result = await convertMarkdownToDocx(request.body, request.id);

  if (!result.ok) {
    await reply.status(result.statusCode).send(result.body);
    return;
  }

  await reply
    .status(200)
    .type(result.artifact.contentType)
    .header(
      "content-disposition",
      contentDispositionAttachment(result.artifact.fileName)
    )
    .header("x-md2docx-diagnostics", diagnosticsToHeader(result.diagnostics))
    .send(Buffer.from(result.artifact.buffer));
}
