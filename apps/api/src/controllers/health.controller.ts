import type { FastifyReply, FastifyRequest } from "fastify";

import { getHealthStatus, getReadinessStatus } from "../services/health.service.js";

export async function healthController(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await reply.send(getHealthStatus());
}

export async function readinessController(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await reply.send(getReadinessStatus());
}
