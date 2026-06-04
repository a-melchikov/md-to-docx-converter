import { validateConfig } from "@md-to-docx/config-schema";
import {
  createDiagnostic,
  diagnosticCode,
  documentPathField,
  type Diagnostic,
  type DiagnosticSeverity
} from "@md-to-docx/domain";
import { useMemo, useState } from "react";

import { DiagnosticsPanel } from "./features/diagnostics/DiagnosticsPanel.js";
import type { DiagnosticSourceInput } from "./features/diagnostics/diagnostics-source.js";
import { DocxExportControls } from "./features/export-docx/DocxExportControls.js";
import { MarkdownEditor } from "./features/markdown-editor/MarkdownEditor.js";
import { useMarkdownDocument } from "./features/markdown-editor/useMarkdownDocument.js";
import { PreviewPanel } from "./features/preview/PreviewPanel.js";
import { StyleSettingsPanel } from "./features/style-settings/StyleSettingsPanel.js";
import { useConfigState } from "./state/useConfigState.js";

const toolbarActions = [
  "Открыть Markdown",
  "Импорт настроек",
  "Экспорт настроек"
] as const;

export function App() {
  const {
    document: markdownDocument,
    updateContent,
    clearContent,
    replaceWithUploadedFile
  } = useMarkdownDocument();
  const { state: configState, updateConfig, replaceConfig } = useConfigState();
  const [previewZoom, setPreviewZoom] = useState(100);
  const [isInputPanelVisible, setIsInputPanelVisible] = useState(true);
  const [isWarningsPanelVisible, setIsWarningsPanelVisible] = useState(true);
  const [previewDiagnostics, setPreviewDiagnostics] = useState<
    readonly Diagnostic[]
  >([]);
  const [exportDiagnostics, setExportDiagnostics] = useState<
    readonly Diagnostic[]
  >([]);
  const [jsonConfigDiagnostics, setJsonConfigDiagnostics] = useState<
    readonly Diagnostic[]
  >([]);
  const [frontendDiagnostics, setFrontendDiagnostics] = useState<
    readonly Diagnostic[]
  >([]);
  const configValidationDiagnostics = useMemo(
    () => validateConfig(configState.config).diagnostics,
    [configState.config]
  );
  const diagnosticSources = useMemo<readonly DiagnosticSourceInput[]>(
    () => [
      {
        source: "config",
        diagnostics: [
          ...configValidationDiagnostics,
          ...jsonConfigDiagnostics
        ]
      },
      { source: "preview", diagnostics: previewDiagnostics },
      { source: "export", diagnostics: exportDiagnostics },
      { source: "frontend", diagnostics: frontendDiagnostics }
    ],
    [
      configValidationDiagnostics,
      exportDiagnostics,
      frontendDiagnostics,
      jsonConfigDiagnostics,
      previewDiagnostics
    ]
  );
  const diagnosticSummary = useMemo(
    () => summarizeDiagnostics(diagnosticSources),
    [diagnosticSources]
  );

  function handleUploadErrorChange(message: string | undefined) {
    setFrontendDiagnostics(
      message === undefined
        ? []
        : [
            createDiagnostic({
              severity: "error",
              code: diagnosticCode("frontend.upload.validation"),
              message,
              path: [documentPathField("markdown")]
            })
          ]
    );
  }

  function handleMarkdownChange(content: string) {
    setFrontendDiagnostics([]);
    updateContent(content);
  }

  function handleMarkdownClear() {
    setFrontendDiagnostics([]);
    clearContent();
  }

  function handleMarkdownUpload(content: string, fileName: string) {
    setFrontendDiagnostics([]);
    replaceWithUploadedFile(content, fileName);
  }

  return (
    <div
      className={[
        "app-shell",
        isInputPanelVisible ? "" : "input-panel-collapsed",
        isWarningsPanelVisible ? "" : "warnings-panel-collapsed"
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="app-header">
        <div className="app-title-group">
          <p className="app-kicker">Рабочее пространство</p>
          <h1>MD → DOCX</h1>
          <p className="app-description">Конвертация Markdown в DOCX</p>
        </div>
        <div className="layout-actions" aria-label="Панели рабочего пространства">
          <button
            aria-controls="input-panel"
            aria-expanded={isInputPanelVisible}
            className="secondary-button"
            type="button"
            onClick={() => setIsInputPanelVisible((value) => !value)}
          >
            {isInputPanelVisible ? "Скрыть панель ввода" : "Показать панель ввода"}
          </button>
          <button
            aria-controls="warnings-panel"
            aria-expanded={isWarningsPanelVisible}
            className="secondary-button"
            type="button"
            onClick={() => setIsWarningsPanelVisible((value) => !value)}
          >
            {isWarningsPanelVisible ? "Скрыть предупреждения" : "Показать предупреждения"}
          </button>
          {!isWarningsPanelVisible && diagnosticSummary.total > 0 ? (
            <span className="collapsed-diagnostics-indicator" role="status">
              {compactDiagnosticsLabel(diagnosticSummary)}
            </span>
          ) : null}
        </div>
        <nav className="app-actions" aria-label="Действия с документом">
          {toolbarActions.map((action) => (
            <button
              className="action-button"
              disabled
              key={action}
              title="Будет реализовано в следующих задачах"
              type="button"
            >
              {action}
            </button>
          ))}
          <DocxExportControls
            config={configState.config}
            markdownDocument={markdownDocument}
            onDiagnosticsChange={setExportDiagnostics}
            previewDiagnostics={previewDiagnostics}
          />
        </nav>
      </header>

      <main className="workspace" aria-label="Рабочая область конвертации">
        <aside
          aria-hidden={!isInputPanelVisible}
          aria-label="Панель ввода и настроек"
          className="workspace-sidebar input-config-panel"
          hidden={!isInputPanelVisible}
          id="input-panel"
        >
          <div className="panel-stack">
            <section
              className="panel editor-panel"
              aria-labelledby="editor-heading"
            >
              <MarkdownEditor
                document={markdownDocument}
                onChange={handleMarkdownChange}
                onClear={handleMarkdownClear}
                onUpload={handleMarkdownUpload}
                onUploadErrorChange={handleUploadErrorChange}
              />
            </section>

            <section
              className="panel settings-panel"
              aria-labelledby="settings-heading"
            >
              <StyleSettingsPanel
                configState={configState}
                onJsonDiagnosticsChange={setJsonConfigDiagnostics}
                replaceConfig={replaceConfig}
                updateConfig={updateConfig}
              />
            </section>
          </div>
        </aside>

        <section
          className="panel preview-panel"
          aria-labelledby="preview-heading"
        >
          <PreviewPanel
            config={configState.config}
            markdownDocument={markdownDocument}
            zoomPercent={previewZoom}
            onDiagnosticsChange={setPreviewDiagnostics}
            onZoomChange={setPreviewZoom}
            onToggleInputPanel={() => setIsInputPanelVisible((value) => !value)}
            onToggleWarningsPanel={() => setIsWarningsPanelVisible((value) => !value)}
            inputPanelVisible={isInputPanelVisible}
            warningsPanelVisible={isWarningsPanelVisible}
          />
        </section>

        <aside
          aria-hidden={!isWarningsPanelVisible}
          aria-labelledby="warnings-heading"
          className="panel warnings-panel"
          hidden={!isWarningsPanelVisible}
          id="warnings-panel"
        >
          <DiagnosticsPanel sources={diagnosticSources} />
        </aside>
      </main>
    </div>
  );
}

interface DiagnosticsCompactSummary {
  readonly error: number;
  readonly warning: number;
  readonly info: number;
  readonly total: number;
}

function summarizeDiagnostics(
  sources: readonly DiagnosticSourceInput[]
): DiagnosticsCompactSummary {
  const diagnostics = sources.flatMap((source) => source.diagnostics);

  return {
    error: countBySeverity(diagnostics, "error"),
    warning: countBySeverity(diagnostics, "warning"),
    info: countBySeverity(diagnostics, "info"),
    total: diagnostics.length
  };
}

function countBySeverity(
  diagnostics: readonly Diagnostic[],
  severity: DiagnosticSeverity
): number {
  return diagnostics.filter((diagnostic) => diagnostic.severity === severity).length;
}

function compactDiagnosticsLabel(summary: DiagnosticsCompactSummary): string {
  const parts = [
    summary.error > 0
      ? formatCount(summary.error, ["ошибка", "ошибки", "ошибок"])
      : undefined,
    summary.warning > 0
      ? formatCount(summary.warning, [
          "предупреждение",
          "предупреждения",
          "предупреждений"
        ])
      : undefined,
    summary.info > 0
      ? formatCount(summary.info, [
          "информационное сообщение",
          "информационных сообщения",
          "информационных сообщений"
        ])
      : undefined
  ].filter(Boolean);

  return parts.join(" · ");
}

function formatCount(
  count: number,
  forms: readonly [string, string, string]
): string {
  const mod100 = count % 100;
  const mod10 = count % 10;

  if (mod100 >= 11 && mod100 <= 14) {
    return `${count} ${forms[2]}`;
  }

  if (mod10 === 1) {
    return `${count} ${forms[0]}`;
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return `${count} ${forms[1]}`;
  }

  return `${count} ${forms[2]}`;
}
