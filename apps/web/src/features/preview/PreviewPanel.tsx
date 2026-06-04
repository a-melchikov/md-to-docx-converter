import type { ConversionConfig } from "@md-to-docx/config-schema";
import type { Diagnostic } from "@md-to-docx/domain";
import { pathToString } from "@md-to-docx/domain";
import { useMemo } from "react";

import type { MarkdownDocumentState } from "../markdown-editor/markdown-document-state.js";
import { useLivePreview } from "./useLivePreview.js";

export interface PreviewPanelProps {
  readonly markdownDocument: MarkdownDocumentState;
  readonly config: ConversionConfig;
  readonly zoomPercent: number;
  readonly onZoomChange: (zoomPercent: number) => void;
}

export function PreviewPanel({
  markdownDocument,
  config,
  zoomPercent,
  onZoomChange
}: PreviewPanelProps) {
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
  const fidelityLabel =
    preview.metadata?.fidelity === "fast-preview"
      ? "Быстрый предпросмотр"
      : "Предпросмотр";

  return (
    <>
      <div className="panel-heading">
        <div>
          <p className="panel-label">Вывод</p>
          <h2 id="preview-heading">Предпросмотр</h2>
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

      <div
        aria-busy={preview.status === "loading"}
        aria-label="HTML предпросмотр документа"
        className="preview-stage"
        role="region"
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
        <span>{fidelityLabel}</span>
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
