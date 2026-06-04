import { readFile } from "node:fs/promises";

import { defaultConfig } from "@md-to-docx/config-schema";
import { describe, expect, it } from "vitest";

import { buildApp } from "../src/app.js";
import { createTestApiEnv } from "./test-env.js";

const VALIDATE_CONFIG_URL = "/api/v1/configs/validate";

interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

interface ApiDiagnostic {
  severity: string;
  code: string;
  message: string;
  path?: unknown;
  metadata?: unknown;
}

interface ConfigValidationResponse {
  valid: boolean;
  diagnostics: ApiDiagnostic[];
}

describe("config validation route", () => {
  it("returns valid result for default config", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await postConfig(app, defaultConfig, {
      "x-request-id": "valid-config"
    });
    const body = response.json<ConfigValidationResponse>();

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-request-id"]).toBe("valid-config");
    expect(body).toEqual({
      diagnostics: [],
      valid: true
    });

    await app.close();
  });

  it("returns diagnostics for config without version", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });
    const config = cloneDefaultConfig();
    delete config.version;

    const response = await postConfig(app, config);
    const body = response.json<ConfigValidationResponse>();

    expect(response.statusCode).toBe(200);
    expect(body.valid).toBe(false);
    expect(body.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "config.validation.required",
          message: expect.stringContaining("version"),
          severity: "error"
        })
      ])
    );

    await app.close();
  });

  it("returns diagnostics for unknown fields", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });
    const config = cloneDefaultConfig();
    config.unknown = true;

    const response = await postConfig(app, config);
    const body = response.json<ConfigValidationResponse>();

    expect(response.statusCode).toBe(200);
    expect(body.valid).toBe(false);
    expect(firstDiagnostic(body)).toMatchObject({
      code: "config.validation.additionalProperty",
      severity: "error"
    });

    await app.close();
  });

  it("returns diagnostics for invalid enum values", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });
    const config = cloneDefaultConfig();
    recordAt(config, "input").markdownProfile = "github";

    const response = await postConfig(app, config);
    const body = response.json<ConfigValidationResponse>();

    expect(response.statusCode).toBe(200);
    expect(body.valid).toBe(false);
    expect(firstDiagnostic(body)).toMatchObject({
      code: "config.validation.enum",
      severity: "error"
    });

    await app.close();
  });

  it("returns diagnostics for invalid unit values", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });
    const config = cloneDefaultConfig();
    recordAt(config, "document", "page", "margin").topTwip = -1;

    const response = await postConfig(app, config);
    const body = response.json<ConfigValidationResponse>();

    expect(response.statusCode).toBe(200);
    expect(body.valid).toBe(false);
    expect(firstDiagnostic(body)).toMatchObject({
      code: "config.validation.minimum",
      severity: "error"
    });

    await app.close();
  });

  it("keeps diagnostic fields needed by JSON mode", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });
    const config = cloneDefaultConfig();
    recordAt(config, "input").markdownProfile = "github";

    const response = await postConfig(app, config);
    const diagnostic = firstDiagnostic(response.json<ConfigValidationResponse>());

    expect(diagnostic.severity).toBe("error");
    expect(diagnostic.code).toEqual(expect.any(String));
    expect(diagnostic.message).toEqual(expect.any(String));
    expect(diagnostic.path).toEqual(expect.any(Array));
    expect(diagnostic.metadata).toEqual(expect.any(Object));

    await app.close();
  });

  it("returns 400 for malformed JSON", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await app.inject({
      headers: {
        "content-type": "application/json",
        "x-request-id": "bad-json"
      },
      method: "POST",
      payload: "{\"version\":",
      url: VALIDATE_CONFIG_URL
    });
    const body = response.json<ApiErrorResponse>();

    expect(response.statusCode).toBe(400);
    expect(response.headers["x-request-id"]).toBe("bad-json");
    expect(body.error).toEqual({
      code: "request.invalidJson",
      message: "Тело запроса должно быть корректным JSON.",
      requestId: "bad-json"
    });

    await app.close();
  });

  it("returns 415 for unsupported content type", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await app.inject({
      headers: {
        "content-type": "text/plain",
        "x-request-id": "wrong-content-type"
      },
      method: "POST",
      payload: JSON.stringify(defaultConfig),
      url: VALIDATE_CONFIG_URL
    });
    const body = response.json<ApiErrorResponse>();

    expect(response.statusCode).toBe(415);
    expect(response.headers["x-request-id"]).toBe("wrong-content-type");
    expect(body.error).toEqual({
      code: "request.unsupportedMediaType",
      message: "Content-Type запроса должен быть application/json.",
      requestId: "wrong-content-type"
    });

    await app.close();
  });

  it("keeps validation rules inside the shared config-schema package", async () => {
    const [routeSource, controllerSource, serviceSource] = await Promise.all([
      readApiSource("routes/config.routes.ts"),
      readApiSource("controllers/config.controller.ts"),
      readApiSource("services/config-validation.service.ts")
    ]);

    expect(routeSource).not.toContain("@md-to-docx/config-schema");
    expect(controllerSource).not.toContain("@md-to-docx/config-schema");
    expect(serviceSource).toContain("@md-to-docx/config-schema");
    expect(serviceSource).toContain("validateConfig");
  });
});

async function postConfig(
  app: Awaited<ReturnType<typeof buildApp>>,
  config: unknown,
  headers: Record<string, string> = {}
) {
  return app.inject({
    headers: {
      "content-type": "application/json",
      ...headers
    },
    method: "POST",
    payload: JSON.stringify(config),
    url: VALIDATE_CONFIG_URL
  });
}

function cloneDefaultConfig(): Record<string, unknown> {
  return structuredClone(defaultConfig) as unknown as Record<string, unknown>;
}

function recordAt(
  root: Record<string, unknown>,
  ...path: string[]
): Record<string, unknown> {
  let current: unknown = root;

  for (const segment of path) {
    if (!isRecord(current)) {
      throw new TypeError(`Expected object before "${segment}".`);
    }

    current = current[segment];
  }

  if (!isRecord(current)) {
    throw new TypeError(`Expected object at "${path.join(".")}".`);
  }

  return current;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstDiagnostic(response: ConfigValidationResponse): ApiDiagnostic {
  const [diagnostic] = response.diagnostics;

  if (diagnostic === undefined) {
    throw new Error("Expected at least one diagnostic.");
  }

  return diagnostic;
}

function readApiSource(relativePath: string): Promise<string> {
  return readFile(new URL(`../src/${relativePath}`, import.meta.url), "utf8");
}
