import type { ConversionConfig } from "@md-to-docx/config-schema";
import type { Diagnostic } from "@md-to-docx/domain";
import { pathToString } from "@md-to-docx/domain";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MarkdownDocumentState } from "../markdown-editor/markdown-document-state.js";
import { useLivePreview } from "./useLivePreview.js";

export interface PreviewPanelProps {
  readonly markdownDocument: MarkdownDocumentState;
  readonly config: ConversionConfig;
  readonly zoomPercent: number;
  readonly onZoomChange: (zoomPercent: number) => void;
  readonly onDiagnosticsChange?: ((diagnostics: readonly Diagnostic[]) => void) | undefined;
}

export function PreviewPanel({
  markdownDocument,
  config,
  zoomPercent,
  onZoomChange,
  onDiagnosticsChange
}: PreviewPanelProps) {
  const previewStageRef = useRef<HTMLDivElement | null>(null);
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
  const totalPagesLabel = Math.max(
    pageCount,
    preview.metadata?.pageCountApproximation ?? pageCount
  );
  const boundedCurrentPage = Math.min(currentPage, pageCount);
  const hasApproximatePagination = preview.diagnostics.some(
    (diagnostic) => diagnostic.code === "preview.fidelity.pageBreakApproximation"
  );

  useEffect(() => {
    setCurrentPage(1);
    const stage = previewStageRef.current;
    if (!stage) {
      return;
    }

    if (typeof stage.scrollTo === "function") {
      stage.scrollTo({ top: 0 });
    } else {
      stage.scrollTop = 0;
    }
  }, [preview.html]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  const scrollToPage = useCallback((pageNumber: number) => {
    const stage = previewStageRef.current;
    if (!stage) {
      return;
    }

    const pages = pageElementsFromStage(stage);
    const targetPage = pages[pageNumber - 1];
    if (!targetPage) {
      return;
    }

    const stageRect = stage.getBoundingClientRect();
    const pageRect = targetPage.getBoundingClientRect();
    const targetTop = stage.scrollTop + pageRect.top - stageRect.top - 24;

    setCurrentPage(pageNumber);
    if (typeof stage.scrollTo === "function") {
      stage.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth"
      });
    } else {
      stage.scrollTop = Math.max(0, targetTop);
    }
  }, []);

  const handlePreviewScroll = useCallback(() => {
    const stage = previewStageRef.current;
    if (!stage) {
      return;
    }

    const pages = pageElementsFromStage(stage);
    if (pages.length <= 1) {
      setCurrentPage(1);
      return;
    }

    const stageRect = stage.getBoundingClientRect();
    const stageCenter = stageRect.top + stageRect.height / 2;
    let closestPage = 1;
    let closestDistance = Number.POSITIVE_INFINITY;

    pages.forEach((page, index) => {
      const pageRect = page.getBoundingClientRect();
      const pageCenter = pageRect.top + pageRect.height / 2;
      const distance = Math.abs(pageCenter - stageCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPage = index + 1;
      }
    });

    setCurrentPage(closestPage);
  }, []);

  const fidelityLabel =
    preview.metadata?.fidelity === "fast-preview"
      ? "Быстрый предпросмотр"
      : "Предпросмотр";

  return (
    <>
      <div className="preview-toolbar">
        <div className="preview-title-group">
          <p className="panel-label">Документ</p>
          <h2 id="preview-heading">Предпросмотр DOCX</h2>
          <span className="status-badge info">{fidelityLabel}</span>
        </div>

        <div className="preview-controls" aria-label="Управление предпросмотром">
          <div className="page-navigation" aria-label="Навигация по страницам">
            <button
              className="icon-button"
              disabled={boundedCurrentPage <= 1}
              type="button"
              aria-label="Предыдущая страница"
              onClick={() => {
                scrollToPage(Math.max(1, boundedCurrentPage - 1));
              }}
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
              onClick={() => {
                scrollToPage(Math.min(pageCount, boundedCurrentPage + 1));
              }}
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
        ref={previewStageRef}
        aria-busy={preview.status === "loading"}
        aria-label="HTML предпросмотр документа"
        className="preview-stage"
        role="region"
        onScroll={handlePreviewScroll}
      >
        {preview.css ? <style data-testid="preview-css">{preview.css}</style> : null}
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
        {hasApproximatePagination ? (
          <span>Приблизительное разбиение</span>
        ) : null}
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

  let pageCount = 0;
  const classAttributePattern = /class=["']([^"']*)["']/gu;
  for (const match of html.matchAll(classAttributePattern)) {
    const classTokens = match[1]?.split(/\s+/u) ?? [];
    if (classTokens.includes("md2docx-page")) {
      pageCount += 1;
    }
  }

  return Math.max(1, pageCount);
}

function pageElementsFromStage(stage: HTMLDivElement): HTMLElement[] {
  return Array.from(
    stage.querySelectorAll<HTMLElement>(".preview-html-scope .md2docx-page")
  );
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
