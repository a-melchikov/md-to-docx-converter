import type {
  Diagnostic,
  DiagnosticCode,
  DocumentPath,
  SourceLocation
} from "@md-to-docx/domain";

import type { HtmlPolicy, UnsupportedNodePolicy } from "./options.js";

export type MarkdownDiagnosticCode =
  | "markdown.unsupportedNode"
  | "markdown.unsupportedHtml"
  | "markdown.invalidInput"
  | "markdown.parseError"
  | "markdown.fallbackText";

export interface CreateMarkdownDiagnosticInput {
  readonly code: MarkdownDiagnosticCode;
  readonly severity: "warning" | "error";
  readonly message: string;
  readonly source?: SourceLocation | undefined;
  readonly path?: DocumentPath | undefined;
  readonly metadata?: Record<string, string | number | boolean | null | undefined>;
}

export const createMarkdownDiagnostic = (
  input: CreateMarkdownDiagnosticInput
): Diagnostic => ({
  severity: input.severity,
  code: input.code as DiagnosticCode,
  message: input.message,
  ...(input.source === undefined ? {} : { source: input.source }),
  ...(input.path === undefined ? {} : { path: input.path }),
  ...(input.metadata === undefined ? {} : { metadata: input.metadata })
});

export const unsupportedNodeMessage = (
  nodeType: string,
  policy: UnsupportedNodePolicy
): string => {
  if (policy === "fallback-text") {
    return `Неподдерживаемый Markdown-элемент "${nodeType}" был преобразован в обычный текст.`;
  }

  if (policy === "error") {
    return `Неподдерживаемый Markdown-элемент "${nodeType}" не может быть преобразован.`;
  }

  return `Неподдерживаемый Markdown-элемент "${nodeType}" был пропущен.`;
};

export const unsupportedHtmlMessage = (policy: HtmlPolicy): string => {
  if (policy === "fallback-text") {
    return "HTML-блок не конвертируется напрямую и был преобразован в обычный текст.";
  }

  if (policy === "error") {
    return "HTML-блок не конвертируется напрямую.";
  }

  return "HTML-блок не конвертируется напрямую и был пропущен.";
};
