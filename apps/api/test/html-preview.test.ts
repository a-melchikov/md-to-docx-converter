import { readFile } from "node:fs/promises";

import { defaultConfig } from "@md-to-docx/config-schema";
import { describe, expect, it } from "vitest";

import { buildApp } from "../src/app.js";
import { MAX_MARKDOWN_CHARS } from "../src/validation/preview-request.validation.js";
import { createTestApiEnv } from "./test-env.js";

const PREVIEW_URL = "/api/v1/preview/html";

interface ApiDiagnostic {
  severity: string;
  code: string;
  message: string;
  path?: unknown;
  source?: {
    file?: string;
  };
  metadata?: unknown;
}

interface HtmlPreviewResponse {
  preview?: {
    html: string;
    css: string;
    metadata: {
      fidelity: "fast-preview";
      pageCountApproximation?: number;
    };
  };
  diagnostics: ApiDiagnostic[];
}

interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

describe("HTML preview route", () => {
  it("returns fast preview for valid markdown and config", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await postPreview(app, {
      markdown: "# Заголовок\n\nТекст",
      config: defaultConfig,
      options: {
        zoom: 1,
        pageMode: "continuous"
      }
    });
    const body = response.json<HtmlPreviewResponse>();

    expect(response.statusCode).toBe(200);
    expect(body.preview?.html).toContain("md2docx-preview");
    expect(body.preview?.html).toContain("md2docx-page");
    expect(body.preview?.css).toContain(".md2docx-preview");
    expect(body.preview?.metadata.fidelity).toBe("fast-preview");
    expect(body.diagnostics).toEqual(expect.any(Array));

    await app.close();
  });

  it("renders heading and paragraph text in preview HTML", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await postPreview(app, {
      markdown: "# Заголовок\n\nОбычный текст",
      config: defaultConfig
    });
    const body = response.json<HtmlPreviewResponse>();

    expect(response.statusCode).toBe(200);
    expect(body.preview?.html).toContain("md2docx-heading-1");
    expect(body.preview?.html).toContain("Заголовок");
    expect(body.preview?.html).toContain("Обычный текст");

    await app.close();
  });

  it("returns parser warning diagnostics for raw HTML", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await postPreview(app, {
      markdown: "<section>raw</section>",
      fileName: "input.md",
      config: defaultConfig
    });
    const body = response.json<HtmlPreviewResponse>();
    const diagnostic = findDiagnostic(body, "markdown.unsupportedHtml");

    expect(response.statusCode).toBe(200);
    expect(body.preview).toBeDefined();
    expect(diagnostic).toMatchObject({
      severity: "warning",
      code: "markdown.unsupportedHtml",
      source: {
        file: "input.md"
      }
    });
    expect(diagnostic.path).toEqual(expect.any(Array));

    await app.close();
  });

  it("returns config diagnostics and does not continue to parser on invalid config", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await postPreview(app, {
      markdown: "# Заголовок",
      config: {
        version: "1.0.0"
      }
    });
    const body = response.json<HtmlPreviewResponse>();
    const serviceSource = await readFile(
      new URL("../src/services/html-preview.service.ts", import.meta.url),
      "utf8"
    );

    expect(response.statusCode).toBe(200);
    expect(body.preview).toBeUndefined();
    expect(body.diagnostics.some((diagnostic) =>
      diagnostic.code.startsWith("config.validation.")
    )).toBe(true);
    expect(serviceSource.indexOf("validateConfig")).toBeLessThan(
      serviceSource.indexOf("parseMarkdown")
    );
    expect(serviceSource).toContain("if (!configValidation.valid)");

    await app.close();
  });

  it("rejects markdown above API limit before preview pipeline", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await postPreview(app, {
      markdown: "x".repeat(MAX_MARKDOWN_CHARS + 1),
      config: defaultConfig
    });
    const body = response.json<HtmlPreviewResponse>();

    expect(response.statusCode).toBe(200);
    expect(body.preview).toBeUndefined();
    expect(findDiagnostic(body, "api.preview.markdownTooLarge")).toMatchObject({
      severity: "error",
      code: "api.preview.markdownTooLarge"
    });

    await app.close();
  });

  it("returns preview security diagnostic for unsafe links", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await postPreview(app, {
      markdown: "[bad](javascript:alert(1))",
      config: defaultConfig
    });
    const body = response.json<HtmlPreviewResponse>();

    expect(response.statusCode).toBe(200);
    expect(body.preview?.html).toContain("md2docx-link-fallback");
    expect(findDiagnostic(body, "preview.security.unsafeUrl")).toMatchObject({
      severity: "warning",
      code: "preview.security.unsafeUrl"
    });

    await app.close();
  });

  it("returns 400 for malformed JSON", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await app.inject({
      headers: {
        "content-type": "application/json",
        "x-request-id": "preview-bad-json"
      },
      method: "POST",
      payload: "{\"markdown\":",
      url: PREVIEW_URL
    });
    const body = response.json<ApiErrorResponse>();

    expect(response.statusCode).toBe(400);
    expect(response.headers["x-request-id"]).toBe("preview-bad-json");
    expect(body.error).toEqual({
      code: "request.invalidJson",
      message: "Тело запроса должно быть корректным JSON.",
      requestId: "preview-bad-json"
    });

    await app.close();
  });

  it("returns 415 for unsupported content type", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await app.inject({
      headers: {
        "content-type": "text/plain",
        "x-request-id": "preview-unsupported-content"
      },
      method: "POST",
      payload: JSON.stringify({
        markdown: "# Заголовок",
        config: defaultConfig
      }),
      url: PREVIEW_URL
    });
    const body = response.json<ApiErrorResponse>();

    expect(response.statusCode).toBe(415);
    expect(response.headers["x-request-id"]).toBe("preview-unsupported-content");
    expect(body.error).toEqual({
      code: "request.unsupportedMediaType",
      message: "Content-Type запроса должен быть application/json.",
      requestId: "preview-unsupported-content"
    });

    await app.close();
  });

  it("returns request id header and diagnostic shape for invalid zoom", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await postPreview(
      app,
      {
        markdown: "# Заголовок",
        config: defaultConfig,
        options: {
          zoom: 10
        }
      },
      {
        "x-request-id": "preview-invalid-zoom"
      }
    );
    const body = response.json<HtmlPreviewResponse>();
    const diagnostic = findDiagnostic(body, "api.preview.invalidZoom");

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-request-id"]).toBe("preview-invalid-zoom");
    expect(diagnostic.severity).toBe("error");
    expect(diagnostic.code).toBe("api.preview.invalidZoom");
    expect(diagnostic.message).toEqual(expect.any(String));
    expect(diagnostic.path).toEqual(expect.any(Array));
    expect(diagnostic.metadata).toEqual(expect.any(Object));

    await app.close();
  });
});

async function postPreview(
  app: Awaited<ReturnType<typeof buildApp>>,
  payload: unknown,
  headers: Record<string, string> = {}
) {
  return app.inject({
    headers: {
      "content-type": "application/json",
      ...headers
    },
    method: "POST",
    payload: JSON.stringify(payload),
    url: PREVIEW_URL
  });
}

function findDiagnostic(
  body: HtmlPreviewResponse,
  code: string
): ApiDiagnostic {
  const diagnostic = body.diagnostics.find((candidate) => candidate.code === code);

  if (diagnostic === undefined) {
    throw new Error(`Expected diagnostic "${code}".`);
  }

  return diagnostic;
}
