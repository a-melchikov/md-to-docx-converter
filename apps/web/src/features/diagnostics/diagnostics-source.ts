import type { Diagnostic } from "@md-to-docx/domain";

export type DiagnosticUiSource =
  | "config"
  | "markdown"
  | "style"
  | "preview"
  | "export"
  | "api"
  | "frontend";

export interface DiagnosticSourceInput {
  readonly source: DiagnosticUiSource;
  readonly diagnostics: readonly Diagnostic[];
}

export function sourceName(source: DiagnosticUiSource): string {
  switch (source) {
    case "config":
      return "Конфигурация";
    case "markdown":
      return "Markdown";
    case "style":
      return "Стили";
    case "preview":
      return "Предпросмотр";
    case "export":
      return "Экспорт DOCX";
    case "api":
      return "API";
    case "frontend":
      return "Интерфейс";
  }
}
