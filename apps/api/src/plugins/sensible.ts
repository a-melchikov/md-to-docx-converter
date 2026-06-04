import sensible from "@fastify/sensible";
import type { FastifyInstance } from "fastify";

export async function registerSensiblePlugin(
  app: FastifyInstance
): Promise<void> {
  await app.register(sensible);
}
