import type {
  Diagnostic,
  DiagnosticCode,
  DiagnosticMetadata,
  DocumentPath,
  SourceLocation
} from "@md-to-docx/domain";

export type StyleDiagnosticCode =
  | "style.fallback"
  | "style.missing"
  | "style.invalid"
  | "style.unsupportedNode"
  | "style.invalidXmlCharacter"
  | "style.unitConversionError";

export interface CreateStyleDiagnosticInput {
  readonly code: StyleDiagnosticCode;
  readonly severity: "warning" | "error";
  readonly message: string;
  readonly source?: SourceLocation | undefined;
  readonly path?: DocumentPath | undefined;
  readonly metadata?: DiagnosticMetadata | undefined;
}

export const createStyleDiagnostic = (
  input: CreateStyleDiagnosticInput
): Diagnostic => ({
  severity: input.severity,
  code: input.code as DiagnosticCode,
  message: input.message,
  ...(input.source === undefined ? {} : { source: input.source }),
  ...(input.path === undefined ? {} : { path: input.path }),
  ...(input.metadata === undefined ? {} : { metadata: input.metadata })
});

export const missingStyleMessage = (styleKey: string): string =>
  `Для элемента "${styleKey}" не найден стиль. Использован fallback-стиль.`;

export const invalidStyleMessage = (styleKey: string): string =>
  `Стиль элемента "${styleKey}" некорректен. Использован fallback-стиль.`;

export const unsupportedNodeMessage = (nodeKind: string): string =>
  `Элемент "${nodeKind}" не поддерживается Style Engine. Использован fallback-стиль.`;

export const invalidXmlCharacterMessage = (
  codePoint: number,
  action: "skipped" | "replaced" | "error"
): string => {
  const hex = codePoint.toString(16).toUpperCase().padStart(4, "0");

  if (action === "replaced") {
    return `Символ U+${hex} недопустим для XML и был заменен на U+FFFD.`;
  }

  if (action === "error") {
    return `Символ U+${hex} недопустим для XML.`;
  }

  return `Символ U+${hex} недопустим для XML и был пропущен.`;
};

export const unitConversionErrorMessage = (
  field: string,
  unit: string
): string => `Значение "${field}" не удалось преобразовать в ${unit}.`;
