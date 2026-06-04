import { describe, expect, it } from "vitest";

import { buildApp } from "../src/app.js";
import { createTestApiEnv } from "./test-env.js";

interface HealthResponse {
  status: "ok";
  service: "md-to-docx-api";
}

interface ReadinessResponse {
  status: "ready";
  service: "md-to-docx-api";
}

describe("health routes", () => {
  it("returns liveness status", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/health"
    });
    const body = response.json<HealthResponse>();

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      service: "md-to-docx-api",
      status: "ok"
    });
    expect(response.headers["x-request-id"]).toEqual(expect.any(String));

    await app.close();
  });

  it("returns readiness status", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/ready"
    });
    const body = response.json<ReadinessResponse>();

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      service: "md-to-docx-api",
      status: "ready"
    });

    await app.close();
  });

  it("preserves incoming request id header", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await app.inject({
      headers: {
        "x-request-id": "request-from-client"
      },
      method: "GET",
      url: "/api/v1/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-request-id"]).toBe("request-from-client");

    await app.close();
  });

  it("keeps health checks usable with rate limit plugin enabled", async () => {
    const app = await buildApp({
      config: createTestApiEnv({ rateLimitMax: 100 }),
      logger: false
    });

    const health = await app.inject({
      method: "GET",
      url: "/api/v1/health"
    });
    const ready = await app.inject({
      method: "GET",
      url: "/api/v1/ready"
    });

    expect(health.statusCode).toBe(200);
    expect(ready.statusCode).toBe(200);

    await app.close();
  });
});
