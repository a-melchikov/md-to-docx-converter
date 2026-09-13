import type { Diagnostic } from "@md-to-docx/domain";

import { buildPreviewCss } from "./css-builder.js";
import {
  addFastModeDiagnostic,
  createPreviewDiagnostic,
  type PreviewRenderContext
} from "./diagnostics.js";
import { buildHtml } from "./html-builder.js";
import { resolvePageLayout } from "./page-layout.js";
import type {
  RenderHtmlPreviewInput,
  RenderHtmlPreviewResult,
  ResolvedHtmlPreviewOptions
} from "./types.js";

export const renderHtmlPreview = (
  input: RenderHtmlPreviewInput
): RenderHtmlPreviewResult => {
  const diagnostics: Diagnostic[] = [];
  const context: PreviewRenderContext = {
    diagnostics,
    fastModeDiagnosticAdded: false
  };
  const options = resolveOptions(input.options, diagnostics);
  const css = buildPreviewCss();
  const layout = resolvePageLayout(input.document, diagnostics);

  addFastModeDiagnostic(context);
  const rendered = buildHtml(input.document, layout, options, css, context);

  if (rendered.pageCountApproximation > 1) {
    diagnostics.push(
      createPreviewDiagnostic({
        severity: "warning",
        code: "preview.fidelity.pageBreakApproximation",
        message: "Разбиение на страницы является приблизительным.",
        metadata: { pageCountApproximation: rendered.pageCountApproximation }
      })
    );
  }

  return {
    html: rendered.html,
    css,
    diagnostics,
    metadata: {
      pageCountApproximation: rendered.pageCountApproximation,
      fidelity: "fast-preview"
    }
  };
};

const resolveOptions = (
  options: RenderHtmlPreviewInput["options"],
  diagnostics: Diagnostic[]
): ResolvedHtmlPreviewOptions => {
  const zoom = options?.zoom ?? 1;
  const safeZoom =
    Number.isFinite(zoom) && zoom > 0 && zoom <= 4 ? zoom : 1;

  if (safeZoom !== zoom) {
    diagnostics.push(
      createPreviewDiagnostic({
        severity: "warning",
        code: "preview.style.fallback",
        message:
          "Некорректный zoom предпросмотра. Использовано значение 1.",
        metadata: { zoom }
      })
    );
  }

  return {
    zoom: safeZoom,
    pageMode: options?.pageMode ?? "continuous",
    includeCss: options?.includeCss ?? false,
    includeDiagnostics: options?.includeDiagnostics ?? false
  };
};
