import type {
  Diagnostic,
  DiagnosticCode,
  DiagnosticMetadata,
  DocumentPath,
  SourceLocation
} from "@md-to-docx/domain";

export type DocxDiagnosticCode =
  | "docx.image.missingAsset"
  | "docx.image.unsupportedFormat"
  | "docx.image.invalidData"
  | "docx.style.fallback"
  | "docx.style.unsupportedProperty"
  | "docx.node.unsupported"
  | "docx.generation.failed"
  | "docx.numbering.fallback";

export interface CreateDocxDiagnosticInput {
  readonly code: DocxDiagnosticCode;
  readonly severity: "warning" | "error";
  readonly message: string;
  readonly source?: SourceLocation | undefined;
  readonly path?: DocumentPath | undefined;
  readonly metadata?: DiagnosticMetadata | undefined;
}

export const createDocxDiagnostic = (
  input: CreateDocxDiagnosticInput
): Diagnostic => ({
  severity: input.severity,
  code: input.code as DiagnosticCode,
  message: input.message,
  ...(input.source === undefined ? {} : { source: input.source }),
  ...(input.path === undefined ? {} : { path: input.path }),
  ...(input.metadata === undefined ? {} : { metadata: input.metadata })
});

export const missingAssetMessage = (src: string): string =>
  `Изображение "${src}" не было встроено: отсутствуют бинарные данные asset.`;

export const unsupportedImageFormatMessage = (src: string): string =>
  `Изображение "${src}" не было встроено: формат не поддерживается DOCX adapter MVP.`;

export const invalidImageDataMessage = (src: string): string =>
  `Изображение "${src}" не было встроено: данные изображения некорректны.`;

export const unsupportedNodeMessage = (kind: string): string =>
  `Элемент "${kind}" не поддерживается DOCX adapter MVP и был обработан через fallback.`;

export const styleFallbackMessage = (kind: string): string =>
  `Для элемента "${kind}" использован fallback DOCX-стиль.`;

export const numberingFallbackMessage = (): string =>
  "Для списка использована fallback-нумерация.";

export const generationFailedMessage = (): string =>
  "DOCX не удалось сгенерировать.";
