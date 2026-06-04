import multipart from "@fastify/multipart";
import type { FastifyInstance } from "fastify";

import type { ApiEnv } from "../config/env.js";

export async function registerMultipartPlugin(
  app: FastifyInstance,
  config: ApiEnv
): Promise<void> {
  await app.register(multipart, {
    limits: {
      fields: config.multipartMaxFields,
      fileSize: config.multipartFileSizeLimitBytes,
      files: config.multipartMaxFiles
    }
  });
}
