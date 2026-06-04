import type { ConversionConfig } from "@md-to-docx/config-schema";
import type { Diagnostic } from "@md-to-docx/domain";
import { pathToString } from "@md-to-docx/domain";

import type { MarkdownDocumentState } from "../markdown-editor/markdown-document-state.js";
import { FileNameInput } from "./FileNameInput.js";
import { mergeExportDiagnostics, useDocxExport } from "./useDocxExport.js";

export interface DocxExportControlsProps {
  readonly markdownDocument: MarkdownDocumentState;
  readonly config: ConversionConfig;
  readonly previewDiagnostics: readonly Diagnostic[];
}

export function DocxExportControls({
  markdownDocument,
  config,
  previewDiagnostics
}: DocxExportControlsProps) {
  const {
    state,
    fileNameInput,
    fileNameError,
    setFileNameInput,
    exportDocx
  } = useDocxExport({ markdownDocument, config });
  const hasMarkdown = markdownDocument.content.trim().length > 0;
  const isLoading = state.status === "loading";
  const diagnostics = mergeExportDiagnostics(
    previewDiagnostics,
    state.diagnostics
  );

  return (
    <section aria-label="Экспорт DOCX" className="docx-export-controls">
      <FileNameInput
        disabled={isLoading}
        error={fileNameError}
        value={fileNameInput}
        onChange={setFileNameInput}
      />
      <button
        className="action-button primary-action"
        disabled={!hasMarkdown || isLoading}
        title={
          hasMarkdown
            ? "Сформировать DOCX через backend API"
            : "Введите Markdown перед экспортом DOCX"
        }
        type="button"
        onClick={() => {
          void exportDocx();
        }}
      >
        Скачать DOCX
      </button>

      {isLoading ? (
        <div className="export-status" role="status">
          Формирование DOCX...
        </div>
      ) : null}
      {state.status === "success" ? (
        <div className="export-status success" role="status">
          DOCX-файл сформирован
        </div>
      ) : null}
      {state.errorMessage ? (
        <div className="export-status error" role="alert">
          <strong>{state.errorMessage}</strong>
          {state.requestId ? <small>Request ID: {state.requestId}</small> : null}
        </div>
      ) : null}
      {diagnostics.length > 0 ? (
        <ExportDiagnostics diagnostics={diagnostics} />
      ) : null}
    </section>
  );
}

function ExportDiagnostics({
  diagnostics
}: {
  readonly diagnostics: readonly Diagnostic[];
}) {
  return (
    <section aria-label="Предупреждения экспорта" className="export-diagnostics">
      <h2>Предупреждения экспорта</h2>
      <ul>
        {diagnostics.map((diagnostic, index) => (
          <li key={`${diagnostic.code}-${index}`}>
            <span className={`diagnostic-severity severity-${diagnostic.severity}`}>
              {severityLabel(diagnostic.severity)}
            </span>
            <span>{diagnostic.message}</span>
            <small>Код: {diagnostic.code}</small>
            {diagnostic.path ? (
              <small>Путь: {pathToString(diagnostic.path)}</small>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function severityLabel(severity: Diagnostic["severity"]): string {
  switch (severity) {
    case "info":
      return "Информация";
    case "warning":
      return "Предупреждение";
    case "error":
      return "Ошибка";
  }
}
