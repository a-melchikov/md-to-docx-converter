import type {
  Diagnostic,
  DiagnosticMetadata,
  DiagnosticSeverity
} from "@md-to-docx/domain";
import { pathToString } from "@md-to-docx/domain";

import { sourceName, type DiagnosticUiSource } from "./diagnostics-source.js";

export interface DiagnosticViewModel {
  readonly id: string;
  readonly severity: DiagnosticSeverity;
  readonly severityLabel: string;
  readonly category: string;
  readonly source: DiagnosticUiSource;
  readonly sourceName: string;
  readonly message: string;
  readonly code: string;
  readonly path?: string | undefined;
  readonly sourceLocation?: string | undefined;
  readonly metadata?: DiagnosticMetadata | undefined;
}

export function diagnosticToViewModel(
  diagnostic: Diagnostic,
  source: DiagnosticUiSource,
  index: number
): DiagnosticViewModel {
  const code = String(diagnostic.code);

  return {
    id: `${source}:${code}:${index}`,
    severity: diagnostic.severity,
    severityLabel: severityLabel(diagnostic.severity),
    category: categoryForDiagnostic(diagnostic, source),
    source,
    sourceName: sourceName(source),
    message: safeDiagnosticMessage(diagnostic.message),
    code,
    ...(diagnostic.path && diagnostic.path.length > 0
      ? { path: pathToString(diagnostic.path) }
      : {}),
    ...(diagnostic.source === undefined
      ? {}
      : { sourceLocation: sourceLocationLabel(diagnostic.source) }),
    ...(diagnostic.metadata === undefined
      ? {}
      : { metadata: diagnostic.metadata })
  };
}

export function severityLabel(severity: DiagnosticSeverity): string {
  switch (severity) {
    case "error":
      return "Ошибка";
    case "warning":
      return "Предупреждение";
    case "info":
      return "Информация";
  }
}

export function severityGroupLabel(severity: DiagnosticSeverity): string {
  switch (severity) {
    case "error":
      return "Ошибки";
    case "warning":
      return "Предупреждения";
    case "info":
      return "Информация";
  }
}

export function categoryForDiagnostic(
  diagnostic: Diagnostic,
  fallbackSource: DiagnosticUiSource
): string {
  const code = String(diagnostic.code);

  if (
    code.startsWith("config.") ||
    code === "config-validation-error" ||
    code === "convert.invalidConfig"
  ) {
    return "Конфигурация";
  }

  if (
    code.startsWith("markdown.") ||
    code === "unsupported-markdown-node"
  ) {
    return "Markdown";
  }

  if (
    code.startsWith("style.") ||
    code === "fallback-style" ||
    code === "invalid-xml-character"
  ) {
    return "Стили";
  }

  if (code.startsWith("preview.") || code === "preview-fidelity-warning") {
    return "Предпросмотр";
  }

  if (code.startsWith("docx.") || code.startsWith("convert.")) {
    return "Экспорт DOCX";
  }

  if (code.startsWith("api.")) {
    return "API";
  }

  if (code.startsWith("frontend.") || code.startsWith("markdownUpload.")) {
    return "Интерфейс";
  }

  if (code.startsWith("asset")) {
    return "Экспорт DOCX";
  }

  return sourceName(fallbackSource) === "API" ? "API" : "Прочее";
}

export function sourceLocationLabel(
  source: NonNullable<Diagnostic["source"]>
): string | undefined {
  const parts: string[] = [];

  if (source.file) {
    parts.push(`Файл: ${source.file}`);
  }

  if (source.start?.line !== undefined) {
    const line = `Строка ${source.start.line}`;
    const column =
      source.start.column === undefined
        ? ""
        : `, столбец ${source.start.column}`;
    parts.push(`${line}${column}`);
  }

  if (source.offset !== undefined) {
    parts.push(`Offset: ${source.offset}`);
  }

  return parts.length > 0 ? parts.join("; ") : undefined;
}

function safeDiagnosticMessage(message: string): string {
  return message.trim().length > 0
    ? message
    : "Произошла ошибка обработки. Подробности доступны в технических деталях.";
}
