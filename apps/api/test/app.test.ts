import { describe, expect, it } from "vitest";

import { buildApp } from "../src/app.js";
import { createTestApiEnv } from "./test-env.js";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

describe("buildApp", () => {
  it("creates a Fastify instance", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    expect(app.server).toBeDefined();

    await app.close();
  });

  it("registers multipart support", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });
    await app.ready();

    expect(app.hasRequestDecorator("isMultipart")).toBe(true);

    await app.close();
  });

  it("returns JSON error response for unknown routes", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await app.inject({
      headers: {
        "x-request-id": "request-404"
      },
      method: "GET",
      url: "/missing"
    });
    const body = response.json<ErrorResponse>();

    expect(response.statusCode).toBe(404);
    expect(response.headers["x-request-id"]).toBe("request-404");
    expect(body.error).toEqual({
      code: "http.notFound",
      message: "Маршрут не найден",
      requestId: "request-404"
    });

    await app.close();
  });

  it("closes without errors", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    await expect(app.close()).resolves.toBeUndefined();
  });
});
