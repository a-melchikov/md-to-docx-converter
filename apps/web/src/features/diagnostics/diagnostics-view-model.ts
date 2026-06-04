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
  readonly explanation: string;
  readonly recommendation: string;
  readonly code: string;
  readonly path?: string | undefined;
  readonly sourceLocation?: string | undefined;
  readonly locationLabel?: string | undefined;
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
    explanation: explanationForDiagnostic(code, source),
    recommendation: recommendationForDiagnostic(code, source),
    code,
    ...(diagnostic.path && diagnostic.path.length > 0
      ? { path: pathToString(diagnostic.path) }
      : {}),
    ...(diagnostic.source === undefined
      ? {}
      : {
          sourceLocation: sourceLocationLabel(diagnostic.source),
          locationLabel: sourceLocationLabel(diagnostic.source)
        }),
    ...(diagnostic.source === undefined && diagnostic.path && diagnostic.path.length > 0
      ? { locationLabel: `Путь: ${pathToString(diagnostic.path)}` }
      : {}),
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
    return "Настройки";
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
    return "Документ";
  }

  if (code.startsWith("preview.") || code === "preview-fidelity-warning") {
    return "Предпросмотр";
  }

  if (code.startsWith("docx.") || code.startsWith("convert.")) {
    return "Экспорт DOCX";
  }

  if (code.startsWith("api.")) {
    return code.startsWith("api.preview")
      ? "Предпросмотр"
      : "Экспорт DOCX";
  }

  if (code.startsWith("frontend.") || code.startsWith("markdownUpload.")) {
    return code.includes("upload") || code.includes("File")
      ? "Файлы"
      : "Настройки";
  }

  if (code.startsWith("asset")) {
    return "Экспорт DOCX";
  }

  return sourceName(fallbackSource) === "API" ? "Предпросмотр" : "Прочее";
}

function explanationForDiagnostic(
  code: string,
  source: DiagnosticUiSource
): string {
  if (code.startsWith("config.") || source === "config") {
    return "Некоторые настройки документа заполнены некорректно или неполно.";
  }

  if (code.startsWith("markdown.")) {
    return "Некоторые элементы Markdown могут быть перенесены в DOCX не полностью.";
  }

  if (code.startsWith("style.")) {
    return "Оформление документа было скорректировано безопасным fallback-правилом.";
  }

  if (code.startsWith("preview.") || code.startsWith("api.preview")) {
    return "Предпросмотр работает в быстром режиме и может отличаться от Microsoft Word.";
  }

  if (code.startsWith("docx.") || code.startsWith("convert.") || source === "export") {
    return "Экспорт DOCX завершился с ограничениями или требует корректировки входных данных.";
  }

  if (source === "frontend") {
    return "Проверьте введённые данные или выбранный файл.";
  }

  return "Сообщение относится к обработке документа.";
}

function recommendationForDiagnostic(
  code: string,
  source: DiagnosticUiSource
): string {
  if (code.startsWith("config.validation.")) {
    return "Проверьте настройки в визуальном режиме или JSON-режиме.";
  }

  if (code.includes("unsupportedHtml") || code.includes("unsupportedNode")) {
    return "Замените неподдерживаемый фрагмент обычным Markdown, если важно сохранить содержимое.";
  }

  if (code.includes("unsafeUrl")) {
    return "Используйте безопасную ссылку с протоколом http, https, mailto или tel.";
  }

  if (code.includes("missingAsset") || code.includes("upload")) {
    return "Проверьте выбранный файл и повторите действие.";
  }

  if (code.startsWith("api.")) {
    return "Повторите действие после восстановления соединения с сервером.";
  }

  if (source === "preview") {
    return "Действие не требуется, если результат предпросмотра выглядит корректно.";
  }

  return "Действие не требуется, если результат документа выглядит корректно.";
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
