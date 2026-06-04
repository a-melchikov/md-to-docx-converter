import type { ConversionConfig } from "@md-to-docx/config-schema";
import type { Diagnostic } from "@md-to-docx/domain";
import { pathToString } from "@md-to-docx/domain";
import { useEffect, useMemo, useState } from "react";

import type { MarkdownDocumentState } from "../markdown-editor/markdown-document-state.js";
import { useLivePreview } from "./useLivePreview.js";

export interface PreviewPanelProps {
  readonly markdownDocument: MarkdownDocumentState;
  readonly config: ConversionConfig;
  readonly zoomPercent: number;
  readonly onZoomChange: (zoomPercent: number) => void;
  readonly onDiagnosticsChange?: ((diagnostics: readonly Diagnostic[]) => void) | undefined;
  readonly onToggleInputPanel?: (() => void) | undefined;
  readonly onToggleWarningsPanel?: (() => void) | undefined;
  readonly inputPanelVisible?: boolean | undefined;
  readonly warningsPanelVisible?: boolean | undefined;
}

export function PreviewPanel({
  markdownDocument,
  config,
  zoomPercent,
  onZoomChange,
  onDiagnosticsChange,
  onToggleInputPanel,
  onToggleWarningsPanel,
  inputPanelVisible = true,
  warningsPanelVisible = true
}: PreviewPanelProps) {
  const [pageMode, setPageMode] = useState<"single" | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const options = useMemo(
    () => ({
      zoom: zoomPercent / 100,
      pageMode: "continuous" as const
    }),
    [zoomPercent]
  );
  const preview = useLivePreview({
    markdown: markdownDocument.content,
    fileName: markdownDocument.fileName,
    config,
    options
  });

  useEffect(() => {
    onDiagnosticsChange?.(preview.diagnostics);
  }, [onDiagnosticsChange, preview.diagnostics]);

  const pageCount = useMemo(
    () => pageCountFromPreviewHtml(preview.html),
    [preview.html]
  );
  const totalPagesLabel =
    preview.metadata?.pageCountApproximation ?? pageCount;
  const boundedCurrentPage = Math.min(currentPage, pageCount);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  const fidelityLabel =
    preview.metadata?.fidelity === "fast-preview"
      ? "Быстрый предпросмотр"
      : "Предпросмотр";
  const singlePageStyle = useMemo(
    () =>
      pageMode === "single"
        ? `.preview-stage.is-single-page .md2docx-page { display: none; }
.preview-stage.is-single-page .md2docx-page:nth-of-type(${boundedCurrentPage}) { display: block; }`
        : "",
    [boundedCurrentPage, pageMode]
  );

  return (
    <>
      <div className="preview-toolbar">
        <div className="preview-title-group">
          <p className="panel-label">Документ</p>
          <h2 id="preview-heading">Предпросмотр DOCX</h2>
          <span className="status-badge info">{fidelityLabel}</span>
        </div>

        <div className="preview-controls" aria-label="Управление предпросмотром">
          <button
            aria-label={
              inputPanelVisible
                ? "Скрыть панель ввода из предпросмотра"
                : "Показать панель ввода из предпросмотра"
            }
            className="icon-text-button"
            type="button"
            onClick={onToggleInputPanel}
            aria-pressed={!inputPanelVisible}
          >
            {inputPanelVisible ? "Ввод: скрыть" : "Ввод: показать"}
          </button>
          <button
            aria-label={
              warningsPanelVisible
                ? "Скрыть предупреждения из предпросмотра"
                : "Показать предупреждения из предпросмотра"
            }
            className="icon-text-button"
            type="button"
            onClick={onToggleWarningsPanel}
            aria-pressed={!warningsPanelVisible}
          >
            {warningsPanelVisible ? "Ошибки: скрыть" : "Ошибки: показать"}
          </button>

          <div className="segmented-control" aria-label="Режим страниц">
            <button
              aria-pressed={pageMode === "all"}
              type="button"
              onClick={() => setPageMode("all")}
            >
              Все страницы
            </button>
            <button
              aria-pressed={pageMode === "single"}
              type="button"
              onClick={() => setPageMode("single")}
            >
              Одна страница
            </button>
          </div>

          <div className="page-navigation" aria-label="Навигация по страницам">
            <button
              className="icon-button"
              disabled={boundedCurrentPage <= 1}
              type="button"
              aria-label="Предыдущая страница"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              ←
            </button>
            <span>
              Страница {boundedCurrentPage} из {totalPagesLabel}
            </span>
            <button
              className="icon-button"
              disabled={boundedCurrentPage >= pageCount}
              type="button"
              aria-label="Следующая страница"
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
            >
              →
            </button>
          </div>

          <label className="zoom-control">
            <span>Масштаб {zoomPercent}%</span>
            <input
              aria-label="Масштаб предпросмотра"
              max="150"
              min="50"
              step="10"
              type="range"
              value={zoomPercent}
              onChange={(event) => onZoomChange(Number(event.currentTarget.value))}
            />
          </label>
        </div>
      </div>

      <div
        aria-busy={preview.status === "loading"}
        aria-label="HTML предпросмотр документа"
        className={[
          "preview-stage",
          pageMode === "single" ? "is-single-page" : "is-all-pages"
        ].join(" ")}
        role="region"
      >
        {preview.css ? <style data-testid="preview-css">{preview.css}</style> : null}
        {singlePageStyle ? (
          <style data-testid="preview-page-mode-css">{singlePageStyle}</style>
        ) : null}
        {preview.status === "idle" ? (
          <div className="preview-page">
            <div className="preview-page-content">
              <p className="preview-placeholder">
                Введите Markdown, чтобы построить предпросмотр через backend API.
              </p>
            </div>
          </div>
        ) : null}
        {preview.html ? (
          <div
            className="preview-html-scope"
            data-testid="preview-html"
            dangerouslySetInnerHTML={{ __html: preview.html }}
          />
        ) : null}
        {preview.status === "loading" ? (
          <div className="preview-loading" role="status">
            Обновление предпросмотра...
          </div>
        ) : null}
        {preview.status === "error" && !preview.html ? (
          <div className="preview-page">
            <div className="preview-page-content">
              <p className="preview-placeholder">
                Предпросмотр пока недоступен.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="preview-meta">
        <span>Постраничный режим</span>
        <span>Разбиение на страницы является приблизительным.</span>
        {preview.updatedAt ? (
          <span>Обновлено: {new Date(preview.updatedAt).toLocaleTimeString("ru-RU")}</span>
        ) : null}
      </div>

      {preview.errorMessage ? (
        <div className="preview-error" role="alert">
          <strong>{preview.errorMessage}</strong>
          {preview.requestId ? <small>Request ID: {preview.requestId}</small> : null}
        </div>
      ) : null}

      <PreviewDiagnostics diagnostics={preview.diagnostics} />
    </>
  );
}

function pageCountFromPreviewHtml(html: string | undefined): number {
  if (!html) {
    return 1;
  }

  const matches = html.match(/class=["'][^"']*\bmd2docx-page\b/gu);
  return Math.max(1, matches?.length ?? 1);
}

function PreviewDiagnostics({
  diagnostics
}: {
  readonly diagnostics: readonly Diagnostic[];
}) {
  if (diagnostics.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Предупреждения предпросмотра"
      className="preview-diagnostics"
    >
      <h3>Предупреждения предпросмотра</h3>
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
