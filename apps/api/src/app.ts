import fastify, {
  type FastifyInstance,
  type FastifyServerOptions
} from "fastify";

import { loadApiEnv, type ApiEnv } from "./config/env.js";
import { registerErrorHandlers } from "./errors/error-handler.js";
import { createLoggerOptions } from "./logging/logger.js";
import { registerCorsPlugin } from "./plugins/cors.js";
import { registerMultipartPlugin } from "./plugins/multipart.js";
import {
  generateRequestId,
  registerRequestIdPlugin,
  REQUEST_ID_HEADER
} from "./plugins/request-id.js";
import { registerRateLimitPlugin } from "./plugins/rate-limit.js";
import { registerSensiblePlugin } from "./plugins/sensible.js";
import { registerApiRoutes } from "./routes/index.js";

export type ApiLoggerOptions = Exclude<
  FastifyServerOptions["logger"],
  undefined
>;

export interface BuildAppOptions {
  config?: ApiEnv;
  logger?: ApiLoggerOptions;
}

export async function buildApp(
  options: BuildAppOptions = {}
): Promise<FastifyInstance> {
  const config = options.config ?? loadApiEnv();
  const logger = options.logger ?? createLoggerOptions(config);

  const app = fastify({
    genReqId: generateRequestId,
    logger,
    requestIdHeader: REQUEST_ID_HEADER,
    requestIdLogLabel: "requestId"
  });

  registerErrorHandlers(app, config);

  await registerRequestIdPlugin(app);
  await registerSensiblePlugin(app);
  await registerCorsPlugin(app, config);
  await registerRateLimitPlugin(app, config);
  await registerMultipartPlugin(app, config);
  await registerApiRoutes(app);

  return app;
}
