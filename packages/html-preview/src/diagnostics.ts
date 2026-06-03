import type {
  Diagnostic,
  DiagnosticCode,
  DiagnosticMetadata,
  DocumentPath,
  SourceLocation
} from "@md-to-docx/domain";

export type PreviewDiagnosticCode =
  | "preview.fidelity.fastMode"
  | "preview.fidelity.pageBreakApproximation"
  | "preview.fidelity.fontFallback"
  | "preview.fidelity.imageApproximation"
  | "preview.fidelity.unsupportedProperty"
  | "preview.fidelity.tableLayoutApproximation"
  | "preview.style.fallback"
  | "preview.node.unsupported"
  | "preview.security.unsafeUrl"
  | "preview.security.escapedHtml";

export interface CreatePreviewDiagnosticInput {
  readonly code: PreviewDiagnosticCode;
  readonly severity: "warning" | "error";
  readonly message: string;
  readonly source?: SourceLocation | undefined;
  readonly path?: DocumentPath | undefined;
  readonly metadata?: DiagnosticMetadata | undefined;
}

export interface PreviewRenderContext {
  readonly diagnostics: Diagnostic[];
  fastModeDiagnosticAdded: boolean;
}

export const createPreviewDiagnostic = (
  input: CreatePreviewDiagnosticInput
): Diagnostic => ({
  severity: input.severity,
  code: input.code as DiagnosticCode,
  message: input.message,
  ...(input.source === undefined ? {} : { source: input.source }),
  ...(input.path === undefined ? {} : { path: input.path }),
  ...(input.metadata === undefined ? {} : { metadata: input.metadata })
});

export const addFastModeDiagnostic = (context: PreviewRenderContext): void => {
  if (context.fastModeDiagnosticAdded) {
    return;
  }

  context.fastModeDiagnosticAdded = true;
  context.diagnostics.push(
    createPreviewDiagnostic({
      severity: "warning",
      code: "preview.fidelity.fastMode",
      message:
        "Предпросмотр работает в быстром режиме и может отличаться от точного отображения в Microsoft Word."
    })
  );
};

export const styleFallbackMessage = (target: string): string =>
  `Для элемента "${target}" использован fallback-стиль предпросмотра.`;

export const unsupportedNodeMessage = (kind: string): string =>
  `Элемент "${kind}" не поддерживается HTML preview MVP и был обработан через fallback.`;

export const unsafeUrlMessage = (url: string): string =>
  `URL "${url}" не был добавлен в предпросмотр, потому что использует небезопасный протокол.`;

export const escapedHtmlMessage = (): string =>
  "Пользовательский HTML-текст был экранирован перед вставкой в предпросмотр.";
