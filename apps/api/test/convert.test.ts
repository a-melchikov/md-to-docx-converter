import { readFile } from "node:fs/promises";

import { defaultConfig } from "@md-to-docx/config-schema";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import { buildApp } from "../src/app.js";
import { DOCX_CONTENT_TYPE } from "@md-to-docx/docx-adapter";
import { decodeDiagnosticsHeader } from "../src/utils/diagnostics-header.js";
import { MAX_CONVERT_MARKDOWN_CHARS } from "../src/validation/convert-request.validation.js";
import { createTestApiEnv } from "./test-env.js";

const CONVERT_URL = "/api/v1/convert";

interface ApiDiagnostic {
  severity: string;
  code: string;
  message: string;
  path?: unknown;
  source?: unknown;
  metadata?: unknown;
}

interface DiagnosticsHeaderPayload {
  diagnostics: ApiDiagnostic[];
  truncated?: boolean;
  total?: number;
}

interface ConvertErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
  diagnostics: ApiDiagnostic[];
}

describe("DOCX convert route", () => {
  it("returns DOCX binary for valid markdown and config", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await postConvert(app, {
      markdown: "# Heading\n\nSimple paragraph",
      config: defaultConfig,
      options: {
        fileName: "document.docx"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe(DOCX_CONTENT_TYPE);
    expect(response.rawPayload.byteLength).toBeGreaterThan(0);
    expect(response.headers["x-request-id"]).toEqual(expect.any(String));

    await app.close();
  });

  it("sets normalized DOCX filename in Content-Disposition", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await postConvert(app, {
      markdown: "# Heading",
      config: defaultConfig,
      options: {
        fileName: "report.md"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-disposition"]).toContain(
      "filename=\"report.docx\""
    );
    expect(response.headers["content-disposition"]).toContain(
      "filename*=UTF-8''report.docx"
    );

    await app.close();
  });

  it("creates a valid DOCX package structure", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await postConvert(app, {
      markdown: "# Heading\n\nSimple paragraph\n\n- Bullet",
      config: defaultConfig
    });
    const zip = await JSZip.loadAsync(response.rawPayload);
    const documentXml = await requiredText(zip, "word/document.xml");

    expect(zip.file("[Content_Types].xml")).toBeTruthy();
    expect(zip.file("_rels/.rels")).toBeTruthy();
    expect(zip.file("word/document.xml")).toBeTruthy();
    expect(zip.file("word/styles.xml")).toBeTruthy();
    expect(zip.file("word/numbering.xml")).toBeTruthy();
    expect(documentXml).toContain("Heading");
    expect(documentXml).toContain("Simple paragraph");
    expect(documentXml).toContain("Bullet");

    await app.close();
  });

  it("returns diagnostics through base64url JSON header", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await postConvert(app, {
      markdown: "<section>raw</section>\n\n![Diagram](diagram.png)",
      config: defaultConfig,
      options: {
        fileName: "input.md"
      }
    });
    const diagnostics = diagnosticsFromResponse(response);

    expect(response.statusCode).toBe(200);
    expect(diagnostics.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          code: "markdown.unsupportedHtml",
          source: expect.objectContaining({
            file: "input.docx"
          })
        }),
        expect.objectContaining({
          severity: "warning",
          code: "docx.image.missingAsset"
        })
      ])
    );

    await app.close();
  });

  it("returns JSON error for invalid config without running DOCX generation", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await postConvert(app, {
      markdown: "# Heading",
      config: {
        version: "1.0.0"
      }
    });
    const body = response.json<ConvertErrorResponse>();
    const serviceSource = await readFile(
      new URL("../src/services/docx-convert.service.ts", import.meta.url),
      "utf8"
    );

    expect(response.statusCode).toBe(400);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(body.error.code).toBe("convert.invalidConfig");
    expect(body.diagnostics.some((diagnostic) =>
      diagnostic.code.startsWith("config.validation.")
    )).toBe(true);
    expect(serviceSource.indexOf("validateConfig")).toBeLessThan(
      serviceSource.indexOf("parseMarkdown")
    );
    expect(serviceSource.indexOf("parseMarkdown({")).toBeLessThan(
      serviceSource.indexOf("generateDocx({")
    );

    await app.close();
  });

  it("rejects markdown above API limit before parsing", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await postConvert(app, {
      markdown: "x".repeat(MAX_CONVERT_MARKDOWN_CHARS + 1),
      config: defaultConfig
    });
    const body = response.json<ConvertErrorResponse>();

    expect(response.statusCode).toBe(413);
    expect(body.error.code).toBe("api.convert.markdownTooLarge");
    expect(body.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "error",
          code: "api.convert.markdownTooLarge"
        })
      ])
    );

    await app.close();
  });

  it("returns 400 for malformed JSON", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await app.inject({
      headers: {
        "content-type": "application/json",
        "x-request-id": "convert-bad-json"
      },
      method: "POST",
      payload: "{\"markdown\":",
      url: CONVERT_URL
    });
    const body = response.json<{ error: ConvertErrorResponse["error"] }>();

    expect(response.statusCode).toBe(400);
    expect(response.headers["x-request-id"]).toBe("convert-bad-json");
    expect(body.error).toEqual({
      code: "request.invalidJson",
      message: "Тело запроса должно быть корректным JSON.",
      requestId: "convert-bad-json"
    });

    await app.close();
  });

  it("returns 415 for unsupported content type", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await app.inject({
      headers: {
        "content-type": "text/plain",
        "x-request-id": "convert-unsupported-content"
      },
      method: "POST",
      payload: JSON.stringify({
        markdown: "# Heading",
        config: defaultConfig
      }),
      url: CONVERT_URL
    });
    const body = response.json<{ error: ConvertErrorResponse["error"] }>();

    expect(response.statusCode).toBe(415);
    expect(response.headers["x-request-id"]).toBe("convert-unsupported-content");
    expect(body.error).toEqual({
      code: "request.unsupportedMediaType",
      message: "Content-Type запроса должен быть application/json.",
      requestId: "convert-unsupported-content"
    });

    await app.close();
  });

  it("sanitizes unsafe filenames before Content-Disposition", async () => {
    const app = await buildApp({ config: createTestApiEnv(), logger: false });

    const response = await postConvert(app, {
      markdown: "# Heading",
      config: defaultConfig,
      options: {
        fileName: "../secret.docx"
      }
    });
    const contentDisposition = String(response.headers["content-disposition"]);

    expect(response.statusCode).toBe(200);
    expect(contentDisposition).toContain("secret.docx");
    expect(contentDisposition).not.toContain("../");
    expect(contentDisposition).not.toContain("..%2F");

    await app.close();
  });
});

async function postConvert(
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
    url: CONVERT_URL
  });
}

async function requiredText(zip: JSZip, path: string): Promise<string> {
  const file = zip.file(path);

  if (file === null) {
    throw new Error(`Missing DOCX package part: ${path}`);
  }

  return file.async("text");
}

function diagnosticsFromResponse(response: {
  readonly headers: Record<string, string | string[] | undefined>;
}): DiagnosticsHeaderPayload {
  const value = response.headers["x-md2docx-diagnostics"];

  if (typeof value !== "string") {
    throw new Error("Missing diagnostics header.");
  }

  return decodeDiagnosticsHeader(value) as DiagnosticsHeaderPayload;
}
