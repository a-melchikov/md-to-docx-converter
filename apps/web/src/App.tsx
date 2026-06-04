import { validateConfig } from "@md-to-docx/config-schema";
import {
  createDiagnostic,
  diagnosticCode,
  documentPathField,
  type Diagnostic
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
    <div className="app-shell">
      <header className="app-header">
        <div className="app-title-group">
          <p className="app-kicker">Конвертер документов</p>
          <h1>MD → DOCX</h1>
          <p className="app-description">Конвертация Markdown в DOCX</p>
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
          className="panel preview-panel"
          aria-labelledby="preview-heading"
        >
          <PreviewPanel
            config={configState.config}
            markdownDocument={markdownDocument}
            zoomPercent={previewZoom}
            onDiagnosticsChange={setPreviewDiagnostics}
            onZoomChange={setPreviewZoom}
          />
        </section>

        <aside
          className="panel settings-panel"
          aria-labelledby="settings-heading"
        >
          <StyleSettingsPanel
            configState={configState}
            onJsonDiagnosticsChange={setJsonConfigDiagnostics}
            replaceConfig={replaceConfig}
            updateConfig={updateConfig}
          />
        </aside>

        <section
          className="panel warnings-panel"
          aria-labelledby="warnings-heading"
        >
          <DiagnosticsPanel sources={diagnosticSources} />
        </section>
      </main>
    </div>
  );
}
