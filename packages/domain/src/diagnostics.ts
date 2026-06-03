import type { DocumentPath, SourceLocation } from "./source.js";

declare const diagnosticCodeBrand: unique symbol;

export type DiagnosticSeverity = "info" | "warning" | "error";

export type KnownDiagnosticCode =
  | "unsupported-markdown-node"
  | "invalid-xml-character"
  | "fallback-style"
  | "config-validation-error"
  | "config.validation.required"
  | "config.validation.additionalProperty"
  | "config.validation.enum"
  | "config.validation.type"
  | "config.validation.pattern"
  | "config.validation.minimum"
  | "config.validation.maximum"
  | "config.validation.unknown"
  | "markdown.unsupportedNode"
  | "markdown.unsupportedHtml"
  | "markdown.invalidInput"
  | "markdown.parseError"
  | "markdown.fallbackText"
  | "style.fallback"
  | "style.missing"
  | "style.invalid"
  | "style.unsupportedNode"
  | "style.invalidXmlCharacter"
  | "style.unitConversionError"
  | "docx.image.missingAsset"
  | "docx.image.unsupportedFormat"
  | "docx.image.invalidData"
  | "docx.style.fallback"
  | "docx.style.unsupportedProperty"
  | "docx.node.unsupported"
  | "docx.generation.failed"
  | "docx.numbering.fallback"
  | "preview.fidelity.fastMode"
  | "preview.fidelity.pageBreakApproximation"
  | "preview.fidelity.fontFallback"
  | "preview.fidelity.imageApproximation"
  | "preview.fidelity.unsupportedProperty"
  | "preview.fidelity.tableLayoutApproximation"
  | "preview.style.fallback"
  | "preview.node.unsupported"
  | "preview.security.unsafeUrl"
  | "preview.security.escapedHtml"
  | "asset-warning"
  | "preview-fidelity-warning";

export type DiagnosticCode =
  | KnownDiagnosticCode
  | (string & { readonly [diagnosticCodeBrand]: "DiagnosticCode" });

export type DiagnosticMetadataValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type DiagnosticMetadata = Record<string, DiagnosticMetadataValue>;

export interface Diagnostic {
  readonly severity: DiagnosticSeverity;
  readonly code: DiagnosticCode;
  readonly message: string;
  readonly source?: SourceLocation | undefined;
  readonly path?: DocumentPath | undefined;
  readonly metadata?: DiagnosticMetadata | undefined;
}

export interface CreateDiagnosticInput {
  readonly severity: DiagnosticSeverity;
  readonly code: DiagnosticCode;
  readonly message: string;
  readonly source?: SourceLocation | undefined;
  readonly path?: DocumentPath | undefined;
  readonly metadata?: DiagnosticMetadata | undefined;
}

const diagnosticSeverities = new Set<DiagnosticSeverity>([
  "info",
  "warning",
  "error"
]);

export const diagnosticCode = (value: string): DiagnosticCode => {
  if (value.trim().length === 0) {
    throw new RangeError("Diagnostic code must not be empty.");
  }

  return value as DiagnosticCode;
};

export const createDiagnostic = (
  input: CreateDiagnosticInput
): Diagnostic => {
  const diagnostic: Diagnostic = {
    severity: input.severity,
    code: input.code,
    message: input.message
  };

  return {
    ...diagnostic,
    ...(input.source === undefined ? {} : { source: input.source }),
    ...(input.path === undefined ? {} : { path: input.path }),
    ...(input.metadata === undefined ? {} : { metadata: input.metadata })
  };
};

export const isDiagnostic = (value: unknown): value is Diagnostic => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    diagnosticSeverities.has(value.severity as DiagnosticSeverity) &&
    typeof value.code === "string" &&
    value.code.length > 0 &&
    typeof value.message === "string" &&
    isOptionalRecord(value.source) &&
    isOptionalDocumentPath(value.path) &&
    isOptionalMetadata(value.metadata)
  );
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isOptionalRecord = (value: unknown): boolean =>
  value === undefined || isRecord(value);

const isOptionalDocumentPath = (value: unknown): boolean =>
  value === undefined || Array.isArray(value);

const isOptionalMetadata = (value: unknown): boolean => {
  if (value === undefined) {
    return true;
  }

  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every(
    (metadataValue) =>
      metadataValue === undefined ||
      metadataValue === null ||
      ["string", "number", "boolean"].includes(typeof metadataValue)
  );
};
