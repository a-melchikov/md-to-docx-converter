import {
  createDiagnostic,
  documentPathField,
  type Diagnostic,
  type DiagnosticCode,
  type DiagnosticMetadata
} from "@md-to-docx/domain";
import type { HtmlPreviewOptions } from "@md-to-docx/html-preview";

export const MAX_PREVIEW_JSON_BODY_BYTES = 1_048_576;
export const MAX_MARKDOWN_CHARS = 500_000;
export const MAX_PREVIEW_FILE_NAME_CHARS = 255;
export const MIN_PREVIEW_ZOOM = 0.25;
export const MAX_PREVIEW_ZOOM = 3;

export interface HtmlPreviewRequest {
  readonly markdown: string;
  readonly config?: unknown;
  readonly fileName?: string | undefined;
  readonly options?: HtmlPreviewOptions | undefined;
}

export type HtmlPreviewRequestValidationResult =
  | {
      readonly valid: true;
      readonly request: HtmlPreviewRequest;
      readonly diagnostics: readonly [];
    }
  | {
      readonly valid: false;
      readonly diagnostics: readonly Diagnostic[];
    };

export interface CreateApiPreviewDiagnosticInput {
  readonly code: ApiPreviewDiagnosticCode;
  readonly message: string;
  readonly severity: "error" | "warning";
  readonly field?: string | undefined;
  readonly metadata?: DiagnosticMetadata | undefined;
}

type ApiPreviewDiagnosticCode =
  | "api.preview.invalidRequest"
  | "api.preview.markdownTooLarge"
  | "api.preview.invalidZoom"
  | "api.preview.pipelineFailed";

export function validateHtmlPreviewRequest(
  body: unknown
): HtmlPreviewRequestValidationResult {
  const diagnostics: Diagnostic[] = [];

  if (!isRecord(body)) {
    diagnostics.push(
      createApiPreviewDiagnostic({
        severity: "error",
        code: "api.preview.invalidRequest",
        message: "Тело запроса должно быть JSON-объектом."
      })
    );
    return { valid: false, diagnostics };
  }

  const markdown = validateMarkdown(body.markdown, diagnostics);
  const fileName = validateFileName(body.fileName, diagnostics);
  const options = validateOptions(body.options, diagnostics);

  if (!("config" in body)) {
    diagnostics.push(
      createApiPreviewDiagnostic({
        severity: "error",
        code: "api.preview.invalidRequest",
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
      ...(fileName === undefined ? {} : { fileName }),
      ...(options === undefined ? {} : { options })
    },
    diagnostics: []
  };
}

export function createApiPreviewDiagnostic(
  input: CreateApiPreviewDiagnosticInput
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
      createApiPreviewDiagnostic({
        severity: "error",
        code: "api.preview.invalidRequest",
        message: "Поле \"markdown\" обязательно и должно быть строкой.",
        field: "markdown"
      })
    );
    return undefined;
  }

  if (value.length > MAX_MARKDOWN_CHARS) {
    diagnostics.push(
      createApiPreviewDiagnostic({
        severity: "error",
        code: "api.preview.markdownTooLarge",
        message: `Markdown превышает лимит ${MAX_MARKDOWN_CHARS} символов.`,
        field: "markdown",
        metadata: {
          limit: MAX_MARKDOWN_CHARS,
          length: value.length
        }
      })
    );
    return undefined;
  }

  return value;
}

function validateFileName(
  value: unknown,
  diagnostics: Diagnostic[]
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    diagnostics.push(
      createApiPreviewDiagnostic({
        severity: "error",
        code: "api.preview.invalidRequest",
        message: "Поле \"fileName\" должно быть строкой.",
        field: "fileName"
      })
    );
    return undefined;
  }

  if (value.length > MAX_PREVIEW_FILE_NAME_CHARS) {
    diagnostics.push(
      createApiPreviewDiagnostic({
        severity: "error",
        code: "api.preview.invalidRequest",
        message: `Поле "fileName" не должно быть длиннее ${MAX_PREVIEW_FILE_NAME_CHARS} символов.`,
        field: "fileName",
        metadata: {
          limit: MAX_PREVIEW_FILE_NAME_CHARS,
          length: value.length
        }
      })
    );
    return undefined;
  }

  return value;
}

function validateOptions(
  value: unknown,
  diagnostics: Diagnostic[]
): HtmlPreviewOptions | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    diagnostics.push(
      createApiPreviewDiagnostic({
        severity: "error",
        code: "api.preview.invalidRequest",
        message: "Поле \"options\" должно быть JSON-объектом.",
        field: "options"
      })
    );
    return undefined;
  }

  const mutableOptions: {
    zoom?: number;
    pageMode?: "single" | "continuous";
  } = {};

  if ("zoom" in value) {
    const zoom = validateZoom(value.zoom, diagnostics);
    if (zoom !== undefined) {
      mutableOptions.zoom = zoom;
    }
  }

  if ("pageMode" in value) {
    if (value.pageMode === "single" || value.pageMode === "continuous") {
      mutableOptions.pageMode = value.pageMode;
    } else {
      diagnostics.push(
        createApiPreviewDiagnostic({
          severity: "error",
          code: "api.preview.invalidRequest",
          message:
            "Поле \"options.pageMode\" должно быть \"single\" или \"continuous\".",
          field: "options",
          metadata: { property: "pageMode" }
        })
      );
    }
  }

  return Object.keys(mutableOptions).length > 0 ? mutableOptions : undefined;
}

function validateZoom(
  value: unknown,
  diagnostics: Diagnostic[]
): number | undefined {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < MIN_PREVIEW_ZOOM ||
    value > MAX_PREVIEW_ZOOM
  ) {
    diagnostics.push(
      createApiPreviewDiagnostic({
        severity: "error",
        code: "api.preview.invalidZoom",
        message: `Поле "options.zoom" должно быть числом от ${MIN_PREVIEW_ZOOM} до ${MAX_PREVIEW_ZOOM}.`,
        field: "options",
        metadata: {
          property: "zoom",
          min: MIN_PREVIEW_ZOOM,
          max: MAX_PREVIEW_ZOOM
        }
      })
    );
    return undefined;
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
