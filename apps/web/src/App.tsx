import { useState } from "react";

import { MarkdownEditor } from "./features/markdown-editor/MarkdownEditor.js";
import { useMarkdownDocument } from "./features/markdown-editor/useMarkdownDocument.js";
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
  const { state: configState, updateConfig } = useConfigState();
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
          <div className="panel-heading">
            <div>
              <p className="panel-label">Вывод</p>
              <h2 id="preview-heading">Предпросмотр</h2>
            </div>
            <label className="zoom-control">
              <span>Масштаб {previewZoom}%</span>
              <input
                aria-label="Масштаб предпросмотра"
                max="150"
                min="50"
                step="10"
                type="range"
                value={previewZoom}
                onChange={(event) => setPreviewZoom(Number(event.target.value))}
              />
            </label>
          </div>
          <div className="preview-stage">
            <div
              className="preview-page"
              style={{ transform: `scale(${previewZoom / 100})` }}
            >
              <div className="preview-page-content">
                <p className="preview-placeholder">
                  Предпросмотр будет реализован в MVP-18 через API
                  /api/v1/preview/html
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside
          className="panel settings-panel"
          aria-labelledby="settings-heading"
        >
          <StyleSettingsPanel
            configState={configState}
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
