import type { Diagnostic, ResolvedDocument } from "@md-to-docx/domain";

import type { PreviewRenderContext } from "./diagnostics.js";
import { escapeHtml } from "./security.js";
import { renderBlock } from "./node-renderers.js";
import type { PageLayout } from "./page-layout.js";
import { cssPx, twipToPx } from "./page-layout.js";
import type { ResolvedHtmlPreviewOptions } from "./types.js";

export const buildHtml = (
  document: ResolvedDocument,
  layout: PageLayout,
  options: ResolvedHtmlPreviewOptions,
  css: string,
  context: PreviewRenderContext
): string => {
  const body = document.children.map((child) => renderBlock(child, context)).join("");
  const diagnosticsHtml = options.includeDiagnostics
    ? renderDiagnostics(context.diagnostics, context)
    : "";
  const html = `<div class="md2docx-preview" data-page-mode="${options.pageMode}" style="${previewVariables(layout, options)}"><div class="md2docx-page"><div class="md2docx-page-content">${body}</div></div>${diagnosticsHtml}</div>`;

  return options.includeCss ? `<style>${css}</style>${html}` : html;
};

const previewVariables = (
  layout: PageLayout,
  options: ResolvedHtmlPreviewOptions
): string =>
  [
    `--preview-zoom: ${options.zoom}`,
    `--page-width: ${cssPx(twipToPx(layout.widthTwip))}`,
    `--page-height: ${cssPx(twipToPx(layout.heightTwip))}`,
    `--margin-top: ${cssPx(twipToPx(layout.margin.topTwip))}`,
    `--margin-right: ${cssPx(twipToPx(layout.margin.rightTwip))}`,
    `--margin-bottom: ${cssPx(twipToPx(layout.margin.bottomTwip))}`,
    `--margin-left: ${cssPx(twipToPx(layout.margin.leftTwip))}`
  ].join("; ");

const renderDiagnostics = (
  diagnostics: readonly Diagnostic[],
  context: PreviewRenderContext
): string =>
  diagnostics.length === 0
    ? ""
    : `<section class="md2docx-diagnostics">${diagnostics
        .map(
          (diagnostic) =>
            `<div class="md2docx-diagnostic md2docx-diagnostic-${diagnostic.severity}">${escapeHtml({ value: diagnostic.message, context })}</div>`
        )
        .join("")}</section>`;
