import type { ApiEnv } from "../src/config/env.js";

export function createTestApiEnv(overrides: Partial<ApiEnv> = {}): ApiEnv {
  return {
    corsOrigin: ["http://localhost:5173"],
    host: "127.0.0.1",
    logLevel: "silent",
    multipartFileSizeLimitBytes: 10_485_760,
    multipartMaxFields: 32,
    multipartMaxFiles: 4,
    nodeEnv: "test",
    port: 8080,
    rateLimitMax: 100,
    rateLimitTimeWindow: "1 minute",
    ...overrides
  };
}
