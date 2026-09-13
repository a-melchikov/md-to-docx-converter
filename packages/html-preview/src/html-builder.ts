import type {
  Diagnostic,
  ResolvedBlockNode,
  ResolvedDocument,
  ResolvedInlineNode,
  ResolvedParagraphSpacing,
  ResolvedStyleSet,
  ResolvedTableCellNode
} from "@md-to-docx/domain";

import type { PreviewRenderContext } from "./diagnostics.js";
import { escapeHtml } from "./security.js";
import { renderBlock } from "./node-renderers.js";
import type { PageLayout, PageMetrics } from "./page-layout.js";
import {
  cssPx,
  halfPointToPt,
  ptToPx,
  resolvePageMetrics,
  twipToPx
} from "./page-layout.js";
import type { ResolvedHtmlPreviewOptions } from "./types.js";

export interface BuildHtmlResult {
  readonly html: string;
  readonly pageCountApproximation: number;
}

export const buildHtml = (
  document: ResolvedDocument,
  layout: PageLayout,
  options: ResolvedHtmlPreviewOptions,
  css: string,
  context: PreviewRenderContext
): BuildHtmlResult => {
  const metrics = resolvePageMetrics(layout);
  const pages = paginateBlocks(document.children, metrics);
  const pagesHtml = pages
    .map(
      (page) =>
        `<div class="md2docx-page"><div class="md2docx-page-content">${page.map((child) => renderBlock(child, context)).join("")}</div></div>`
    )
    .join("");
  const diagnosticsHtml = options.includeDiagnostics
    ? renderDiagnostics(context.diagnostics, context)
    : "";
  const html = `<div class="md2docx-preview" data-page-mode="${options.pageMode}" style="${previewVariables(layout, options)}">${pagesHtml}${diagnosticsHtml}</div>`;

  return {
    html: options.includeCss ? `<style>${css}</style>${html}` : html,
    pageCountApproximation: pages.length
  };
};

const previewVariables = (
  layout: PageLayout,
  options: ResolvedHtmlPreviewOptions
): string => {
  const metrics = resolvePageMetrics(layout);

  return [
    `--preview-zoom: ${options.zoom}`,
    `--page-width: ${cssPx(metrics.pageWidthPx)}`,
    `--page-height: ${cssPx(metrics.pageHeightPx)}`,
    `--content-width: ${cssPx(metrics.contentWidthPx)}`,
    `--content-height: ${cssPx(metrics.contentHeightPx)}`,
    `--margin-top: ${cssPx(metrics.margin.topPx)}`,
    `--margin-right: ${cssPx(metrics.margin.rightPx)}`,
    `--margin-bottom: ${cssPx(metrics.margin.bottomPx)}`,
    `--margin-left: ${cssPx(metrics.margin.leftPx)}`
  ].join("; ");
};

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

const paginateBlocks = (
  blocks: readonly ResolvedBlockNode[],
  metrics: PageMetrics
): readonly (readonly ResolvedBlockNode[])[] => {
  if (blocks.length === 0) {
    return [[]];
  }

  const capacity = metrics.contentHeightPx;
  const pages: ResolvedBlockNode[][] = [];
  let currentPage: ResolvedBlockNode[] = [];
  let currentHeight = 0;

  for (const block of blocks) {
    const blockHeight = estimateBlockHeight(block, metrics, 0);
    const shouldBreakBefore =
      hasPageBreakBefore(block) ||
      (currentPage.length > 0 && currentHeight + blockHeight > capacity);

    if (shouldBreakBefore && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [];
      currentHeight = 0;
    }

    currentPage.push(block);
    currentHeight += Math.min(blockHeight, capacity);
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
};

const estimateBlockHeight = (
  block: ResolvedBlockNode,
  metrics: PageMetrics,
  nestingLevel: number
): number => {
  switch (block.kind) {
    case "paragraph":
      return estimateTextBlockHeight(block.children, block.style, metrics, nestingLevel);
    case "heading":
      return estimateTextBlockHeight(block.children, block.style, metrics, nestingLevel, {
        fallbackSizeHalfPt: headingFallbackSizeHalfPt(block.level),
        fallbackLineMultiplier: 1.16
      });
    case "blockquote":
      return estimateChildrenHeight(block.children, metrics, nestingLevel + 1) + 28;
    case "unordered-list":
    case "ordered-list":
      return estimateChildrenHeight(block.children, metrics, nestingLevel + 1) + 16;
    case "list-item":
      return estimateChildrenHeight(block.children, metrics, nestingLevel) + 8;
    case "code-block":
      return estimateCodeBlockHeight(block.value, block.style, metrics, nestingLevel);
    case "thematic-break":
      return 28;
    case "table":
      return Math.max(
        44,
        block.children.reduce(
          (sum, row) => sum + estimateBlockHeight(row, metrics, nestingLevel),
          0
        )
      );
    case "table-row":
      return Math.max(
        34,
        block.children.reduce(
          (height, cell) =>
            Math.max(height, estimateTableCellHeight(cell, metrics, nestingLevel)),
          0
        )
      );
    case "table-cell":
      return estimateTableCellHeight(block, metrics, nestingLevel);
    case "image-block":
      return 190;
    case "unsupported-block":
      return estimateTextHeight({
        text: block.fallbackText ?? block.originalType,
        availableWidthPx: metrics.contentWidthPx,
        fontSizePx: ptToPx(12),
        lineHeightPx: ptToPx(12) * 1.15
      }) + 12;
  }
};

const estimateChildrenHeight = (
  children: readonly ResolvedBlockNode[],
  metrics: PageMetrics,
  nestingLevel: number
): number =>
  children.reduce(
    (sum, child) => sum + estimateBlockHeight(child, metrics, nestingLevel),
    0
  );

const estimateTableCellHeight = (
  cell: ResolvedTableCellNode,
  metrics: PageMetrics,
  nestingLevel: number
): number =>
  Math.max(34, estimateChildrenHeight(cell.children, metrics, nestingLevel) + 12);

const estimateTextBlockHeight = (
  children: readonly ResolvedInlineNode[],
  style: ResolvedStyleSet,
  metrics: PageMetrics,
  nestingLevel: number,
  options: {
    readonly fallbackSizeHalfPt?: number;
    readonly fallbackLineMultiplier?: number;
  } = {}
): number => {
  const text = inlineText(children);
  const fontSizePx = runFontSizePx(style, options.fallbackSizeHalfPt);
  const lineHeight = lineHeightPx(
    style.paragraph?.spacing,
    fontSizePx,
    options.fallbackLineMultiplier ?? 1.15
  );
  const availableWidthPx = availableTextWidthPx(style, metrics, nestingLevel);
  const contentHeight = estimateTextHeight({
    text,
    availableWidthPx,
    fontSizePx,
    lineHeightPx: lineHeight
  });
  const spacingBefore =
    style.paragraph?.spacing?.beforeTwip === undefined
      ? 0
      : twipToPx(style.paragraph.spacing.beforeTwip);
  const spacingAfter =
    style.paragraph?.spacing?.afterTwip === undefined
      ? 8
      : twipToPx(style.paragraph.spacing.afterTwip);

  return contentHeight + spacingBefore + spacingAfter;
};

const estimateCodeBlockHeight = (
  text: string,
  style: ResolvedStyleSet,
  metrics: PageMetrics,
  nestingLevel: number
): number => {
  const fontSizePx = runFontSizePx(style, 20);
  const lineHeight = lineHeightPx(style.paragraph?.spacing, fontSizePx, 1.1);
  const lines = text.split(/\r?\n/u);
  const availableWidthPx = availableTextWidthPx(style, metrics, nestingLevel) - 20;
  const lineCount = lines.reduce(
    (count, line) =>
      count +
      Math.max(
        1,
        Math.ceil(line.length / charsPerLine(availableWidthPx, fontSizePx, 0.6))
      ),
    0
  );
  const spacingBefore =
    style.paragraph?.spacing?.beforeTwip === undefined
      ? 0
      : twipToPx(style.paragraph.spacing.beforeTwip);
  const spacingAfter =
    style.paragraph?.spacing?.afterTwip === undefined
      ? 0
      : twipToPx(style.paragraph.spacing.afterTwip);

  return Math.max(44, lineCount * lineHeight + 20 + spacingBefore + spacingAfter);
};

const estimateTextHeight = ({
  text,
  availableWidthPx,
  fontSizePx,
  lineHeightPx
}: {
  readonly text: string;
  readonly availableWidthPx: number;
  readonly fontSizePx: number;
  readonly lineHeightPx: number;
}): number => {
  const explicitLines = Math.max(1, text.split(/\r?\n/u).length);
  const wrappedLines = text
    .split(/\r?\n/u)
    .reduce(
      (sum, line) =>
        sum + Math.max(1, Math.ceil(line.length / charsPerLine(availableWidthPx, fontSizePx))),
      0
    );

  return Math.max(explicitLines, wrappedLines) * lineHeightPx;
};

const availableTextWidthPx = (
  style: ResolvedStyleSet,
  metrics: PageMetrics,
  nestingLevel: number
): number => {
  const indentation = style.paragraph?.indentation;
  const leftIndent =
    indentation?.leftTwip === undefined ? nestingLevel * 24 : twipToPx(indentation.leftTwip);
  const rightIndent =
    indentation?.rightTwip === undefined ? 0 : twipToPx(indentation.rightTwip);

  return Math.max(80, metrics.contentWidthPx - leftIndent - rightIndent);
};

const charsPerLine = (
  availableWidthPx: number,
  fontSizePx: number,
  averageCharWidthMultiplier = 0.52
): number =>
  Math.max(8, Math.floor(availableWidthPx / (fontSizePx * averageCharWidthMultiplier)));

const runFontSizePx = (
  style: ResolvedStyleSet,
  fallbackSizeHalfPt = 24
): number => {
  const halfPoint = style.run?.sizeHalfPt ?? fallbackSizeHalfPt;

  return ptToPx(halfPointToPt(halfPoint));
};

const lineHeightPx = (
  spacing: ResolvedParagraphSpacing | undefined,
  fontSizePx: number,
  fallbackMultiplier: number
): number => {
  if (spacing?.lineTwip === undefined) {
    return fontSizePx * fallbackMultiplier;
  }

  const requestedLineHeight =
    spacing.lineRule === "auto" || spacing.lineRule === undefined
      ? fontSizePx * (spacing.lineTwip / 240)
      : twipToPx(spacing.lineTwip);

  return spacing.lineRule === "atLeast"
    ? Math.max(fontSizePx * fallbackMultiplier, requestedLineHeight)
    : requestedLineHeight;
};

const inlineText = (nodes: readonly ResolvedInlineNode[]): string =>
  nodes
    .map((node) => {
      switch (node.kind) {
        case "text":
        case "inline-code":
          return node.value;
        case "strong":
        case "emphasis":
        case "strikethrough":
        case "link":
          return inlineText(node.children);
        case "inline-image":
          return node.alt ?? "";
        case "hard-break":
        case "soft-break":
          return "\n";
        case "unsupported-inline":
          return node.fallbackText ?? node.originalType;
      }
    })
    .join("");

const headingFallbackSizeHalfPt = (level: 1 | 2 | 3 | 4 | 5 | 6): number => {
  switch (level) {
    case 1:
      return 32;
    case 2:
      return 28;
    case 3:
      return 26;
    case 4:
      return 24;
    case 5:
      return 22;
    case 6:
      return 20;
  }
};

const hasPageBreakBefore = (block: ResolvedBlockNode): boolean =>
  block.style.paragraph?.pageBreakBefore === true;
