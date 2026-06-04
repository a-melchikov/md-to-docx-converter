import {
  createDiagnostic,
  documentPathField,
  type Diagnostic,
  type DiagnosticCode,
  type DiagnosticMetadata
} from "@md-to-docx/domain";

import { safeDocxResponseFileName } from "../utils/safe-file-name.js";

export const MAX_CONVERT_JSON_BODY_BYTES = 1_048_576;
export const MAX_CONVERT_MARKDOWN_CHARS = 500_000;
export const MAX_CONVERT_FILE_NAME_CHARS = 120;
export const MAX_CONVERT_ASSETS_COUNT = 50;

export interface ConvertRequest {
  readonly markdown: string;
  readonly config: unknown;
  readonly fileName: string;
}

export type ConvertRequestValidationResult =
  | {
      readonly valid: true;
      readonly request: ConvertRequest;
      readonly diagnostics: readonly [];
    }
  | {
      readonly valid: false;
      readonly diagnostics: readonly Diagnostic[];
    };

interface CreateApiConvertDiagnosticInput {
  readonly code: ApiConvertDiagnosticCode;
  readonly message: string;
  readonly severity: "error" | "warning";
  readonly field?: string | undefined;
  readonly metadata?: DiagnosticMetadata | undefined;
}

type ApiConvertDiagnosticCode =
  | "api.convert.invalidRequest"
  | "api.convert.markdownTooLarge"
  | "api.convert.invalidFileName"
  | "api.convert.pipelineFailed";

export function validateConvertRequest(
  body: unknown
): ConvertRequestValidationResult {
  const diagnostics: Diagnostic[] = [];

  if (!isRecord(body)) {
    diagnostics.push(
      createApiConvertDiagnostic({
        severity: "error",
        code: "api.convert.invalidRequest",
        message: "Тело запроса должно быть JSON-объектом."
      })
    );
    return { valid: false, diagnostics };
  }

  const markdown = validateMarkdown(body.markdown, diagnostics);
  const fileName = validateFileName(body.options, diagnostics);
  validateAssets(body.assets, diagnostics);

  if (!("config" in body)) {
    diagnostics.push(
      createApiConvertDiagnostic({
        severity: "error",
        code: "api.convert.invalidRequest",
        message: "Поле \"config\" обязательно.",
        field: "config"
      })
    );
  }

  if (diagnostics.length > 0 || markdown === undefined) {
    return { valid: false, diagnostics };
  }

  return {
    valid: true,
    request: {
      markdown,
      config: body.config,
      fileName
    },
    diagnostics: []
  };
}

export function createApiConvertDiagnostic(
  input: CreateApiConvertDiagnosticInput
): Diagnostic {
  return createDiagnostic({
    severity: input.severity,
    code: input.code as DiagnosticCode,
    message: input.message,
    ...(input.field === undefined
      ? {}
      : { path: [documentPathField(input.field)] }),
    ...(input.metadata === undefined ? {} : { metadata: input.metadata })
  });
}

function validateMarkdown(
  value: unknown,
  diagnostics: Diagnostic[]
): string | undefined {
  if (typeof value !== "string") {
    diagnostics.push(
      createApiConvertDiagnostic({
        severity: "error",
        code: "api.convert.invalidRequest",
        message: "Поле \"markdown\" обязательно и должно быть строкой.",
        field: "markdown"
      })
    );
    return undefined;
  }

  if (value.length > MAX_CONVERT_MARKDOWN_CHARS) {
    diagnostics.push(
      createApiConvertDiagnostic({
        severity: "error",
        code: "api.convert.markdownTooLarge",
        message: `Markdown превышает лимит ${MAX_CONVERT_MARKDOWN_CHARS} символов.`,
        field: "markdown",
        metadata: {
          limit: MAX_CONVERT_MARKDOWN_CHARS,
          length: value.length
        }
      })
    );
    return undefined;
  }

  return value;
}

function validateFileName(
  options: unknown,
  diagnostics: Diagnostic[]
): string {
  if (options === undefined) {
    return safeDocxResponseFileName(undefined);
  }

  if (!isRecord(options)) {
    diagnostics.push(
      createApiConvertDiagnostic({
        severity: "error",
        code: "api.convert.invalidRequest",
        message: "Поле \"options\" должно быть JSON-объектом.",
        field: "options"
      })
    );
    return safeDocxResponseFileName(undefined);
  }

  const fileName = options.fileName;

  if (fileName === undefined) {
    return safeDocxResponseFileName(undefined);
  }

  if (typeof fileName !== "string") {
    diagnostics.push(
      createApiConvertDiagnostic({
        severity: "error",
        code: "api.convert.invalidFileName",
        message: "Поле \"options.fileName\" должно быть строкой.",
        field: "options",
        metadata: { property: "fileName" }
      })
    );
    return safeDocxResponseFileName(undefined);
  }

  if (fileName.length > MAX_CONVERT_FILE_NAME_CHARS) {
    diagnostics.push(
      createApiConvertDiagnostic({
        severity: "error",
        code: "api.convert.invalidFileName",
        message: `Поле "options.fileName" не должно быть длиннее ${MAX_CONVERT_FILE_NAME_CHARS} символов.`,
        field: "options",
        metadata: {
          property: "fileName",
          limit: MAX_CONVERT_FILE_NAME_CHARS,
          length: fileName.length
        }
      })
    );
    return safeDocxResponseFileName(undefined);
  }

  return safeDocxResponseFileName(fileName);
}

function validateAssets(value: unknown, diagnostics: Diagnostic[]): void {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value) || Array.isArray(value)) {
    diagnostics.push(
      createApiConvertDiagnostic({
        severity: "error",
        code: "api.convert.invalidRequest",
        message: "Поле \"assets\" должно быть JSON-объектом.",
        field: "assets"
      })
    );
    return;
  }

  const count = Object.keys(value).length;

  if (count > MAX_CONVERT_ASSETS_COUNT) {
    diagnostics.push(
      createApiConvertDiagnostic({
        severity: "error",
        code: "api.convert.invalidRequest",
        message: `Поле "assets" содержит больше ${MAX_CONVERT_ASSETS_COUNT} элементов.`,
        field: "assets",
        metadata: {
          limit: MAX_CONVERT_ASSETS_COUNT,
          count
        }
      })
    );
    return;
  }

  if (count > 0) {
    diagnostics.push(
      createApiConvertDiagnostic({
        severity: "error",
        code: "api.convert.invalidRequest",
        message:
          "Передача binary assets через JSON пока не поддерживается в MVP.",
        field: "assets",
        metadata: {
          count
        }
      })
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
