import { useState } from "react";

import { MarkdownEditor } from "./features/markdown-editor/MarkdownEditor.js";
import { useMarkdownDocument } from "./features/markdown-editor/useMarkdownDocument.js";
import { PreviewPanel } from "./features/preview/PreviewPanel.js";
import { StyleSettingsPanel } from "./features/style-settings/StyleSettingsPanel.js";
import { useConfigState } from "./state/useConfigState.js";

const toolbarActions = [
  "Открыть Markdown",
  "Импорт настроек",
  "Экспорт настроек",
  "Скачать DOCX"
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
        </nav>
      </header>

      <main className="workspace" aria-label="Рабочая область конвертации">
        <section
          className="panel editor-panel"
          aria-labelledby="editor-heading"
        >
          <MarkdownEditor
            document={markdownDocument}
            onChange={updateContent}
            onClear={clearContent}
            onUpload={replaceWithUploadedFile}
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
            onZoomChange={setPreviewZoom}
          />
        </section>

        <aside
          className="panel settings-panel"
          aria-labelledby="settings-heading"
        >
          <StyleSettingsPanel
            configState={configState}
            replaceConfig={replaceConfig}
            updateConfig={updateConfig}
          />
        </aside>

        <section
          className="panel warnings-panel"
          aria-labelledby="warnings-heading"
        >
          <div className="panel-heading">
            <div>
              <p className="panel-label">Диагностика</p>
              <h2 id="warnings-heading">Предупреждения</h2>
            </div>
            <span className="panel-status">0</span>
          </div>
          <div className="empty-warning-state" role="status">
            <strong>Предупреждений пока нет</strong>
            <span>
              Реальные предупреждения появятся здесь после интеграции конвейера
              обработки в MVP-20.
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
