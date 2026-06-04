import type { FastifyReply, FastifyRequest } from "fastify";

import { toConfigValidationResponse } from "../dto/config-validation.dto.js";
import { validateConversionConfig } from "../services/config-validation.service.js";

export async function validateConfigController(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const result = validateConversionConfig(request.body);

  await reply.status(200).send(toConfigValidationResponse(result));
}
