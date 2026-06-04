import type { ApiLoggerOptions } from "../app.js";
import type { ApiEnv } from "../config/env.js";

export function createLoggerOptions(config: ApiEnv): ApiLoggerOptions {
  if (config.nodeEnv === "test" || config.logLevel === "silent") {
    return false;
  }

  return {
    level: config.logLevel,
    redact: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['set-cookie']"
    ]
  };
}
