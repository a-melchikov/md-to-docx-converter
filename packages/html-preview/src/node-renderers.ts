import type {
  ResolvedBlockNode,
  ResolvedInlineNode,
  ResolvedListItemNode,
  ResolvedOrderedListNode,
  ResolvedTableCellNode,
  ResolvedUnorderedListNode
} from "@md-to-docx/domain";

import {
  createPreviewDiagnostic,
  unsupportedNodeMessage,
  type PreviewRenderContext
} from "./diagnostics.js";
import {
  codeBlockStyleToCss,
  imageStyleToCss,
  listStyleToCss,
  paragraphStyleToCss,
  runStyleToCss,
  tableCellStyleToCss,
  tableStyleToCss
} from "./style-to-css.js";
import { escapeAttribute, escapeHtml, safeHref, safeImageSrc } from "./security.js";

export const renderBlock = (
  node: ResolvedBlockNode,
  context: PreviewRenderContext
): string => {
  switch (node.kind) {
    case "paragraph":
      diagnoseParagraphFidelity(node, context);
      return `<p class="md2docx-paragraph" style="${paragraphStyleToCss(node.style)}">${renderInlineNodes(node.children, context)}</p>`;
    case "heading": {
      const level = node.level;
      diagnoseParagraphFidelity(node, context);
      return `<h${level} class="md2docx-heading md2docx-heading-${level}" style="${paragraphStyleToCss(node.style)}">${renderInlineNodes(node.children, context)}</h${level}>`;
    }
    case "blockquote":
      diagnoseParagraphFidelity(node, context);
      return `<blockquote class="md2docx-blockquote" style="${paragraphStyleToCss(node.style)}">${node.children.map((child) => renderBlock(child, context)).join("")}</blockquote>`;
    case "unordered-list":
      return renderList("ul", node, context);
    case "ordered-list":
      return renderList("ol", node, context);
    case "list-item":
      return renderListItem(node, context);
    case "code-block":
      return `<pre class="md2docx-code-block" style="${codeBlockStyleToCss(node.style)}"><code>${escapeHtml({ value: node.value, context, source: node.source, path: node.path })}</code></pre>`;
    case "thematic-break":
      return `<hr class="md2docx-thematic-break" style="${paragraphStyleToCss(node.style)}">`;
    case "table":
      context.diagnostics.push(
        createPreviewDiagnostic({
          severity: "warning",
          code: "preview.fidelity.tableLayoutApproximation",
          message:
            "Отображение таблицы в fast preview является приблизительным.",
          source: node.source,
          path: node.path
        })
      );
      return `<table class="md2docx-table" style="${tableStyleToCss(node.style)}"><tbody>${node.children
        .map(
          (row) =>
            `<tr class="md2docx-table-row">${row.children.map((cell) => renderTableCell(cell, context)).join("")}</tr>`
        )
        .join("")}</tbody></table>`;
    case "table-row":
      return `<div class="md2docx-table-row">${node.children.map((cell) => renderTableCell(cell, context)).join("")}</div>`;
    case "table-cell":
      return renderTableCell(node, context);
    case "image-block":
      return `<figure class="md2docx-image-block" style="${paragraphStyleToCss(node.style)}">${renderImage(node.src, node.alt, node.title, node.style, context, node.source, node.path)}</figure>`;
    case "unsupported-block":
      context.diagnostics.push(
        createPreviewDiagnostic({
          severity: "warning",
          code: "preview.node.unsupported",
          message: unsupportedNodeMessage(node.originalType),
          source: node.source,
          path: node.path,
          metadata: { nodeKind: node.kind, originalType: node.originalType }
        })
      );
      return `<div class="md2docx-unsupported-block">${escapeHtml({ value: node.fallbackText ?? node.originalType, context, source: node.source, path: node.path })}</div>`;
  }
};

export const renderInlineNodes = (
  nodes: readonly ResolvedInlineNode[],
  context: PreviewRenderContext
): string => nodes.map((node) => renderInline(node, context)).join("");

const renderInline = (
  node: ResolvedInlineNode,
  context: PreviewRenderContext
): string => {
  switch (node.kind) {
    case "text":
      diagnoseRunFidelity(node, context);
      return escapeHtml({
        value: node.value,
        context,
        source: node.source,
        path: node.path
      });
    case "strong":
      diagnoseRunFidelity(node, context);
      return `<strong style="${runStyleToCss(node.style)}">${renderInlineNodes(node.children, context)}</strong>`;
    case "emphasis":
      diagnoseRunFidelity(node, context);
      return `<em style="${runStyleToCss(node.style)}">${renderInlineNodes(node.children, context)}</em>`;
    case "strikethrough":
      diagnoseRunFidelity(node, context);
      return `<span class="md2docx-strike" style="${runStyleToCss(node.style)}">${renderInlineNodes(node.children, context)}</span>`;
    case "inline-code":
      diagnoseRunFidelity(node, context);
      return `<code class="md2docx-inline-code" style="${runStyleToCss(node.style)}">${escapeHtml({ value: node.value, context, source: node.source, path: node.path })}</code>`;
    case "link": {
      diagnoseRunFidelity(node, context);
      const label = renderInlineNodes(node.children, context);
      const href = safeHref(node.href, context, node.source, node.path);

      return href === undefined
        ? `<span class="md2docx-link-fallback">${label}</span>`
        : `<a class="md2docx-link" href="${href}" target="_blank" rel="noopener noreferrer" style="${runStyleToCss(node.style)}">${label}</a>`;
    }
    case "inline-image":
      return renderImage(
        node.src,
        node.alt,
        node.title,
        node.style,
        context,
        node.source,
        node.path
      );
    case "hard-break":
      return "<br>";
    case "soft-break":
      return "\n";
    case "unsupported-inline":
      context.diagnostics.push(
        createPreviewDiagnostic({
          severity: "warning",
          code: "preview.node.unsupported",
          message: unsupportedNodeMessage(node.originalType),
          source: node.source,
          path: node.path,
          metadata: { nodeKind: node.kind, originalType: node.originalType }
        })
      );
      return `<span class="md2docx-unsupported-inline">${escapeHtml({ value: node.fallbackText ?? node.originalType, context, source: node.source, path: node.path })}</span>`;
  }
};

const diagnoseParagraphFidelity = (
  node: Extract<
    ResolvedBlockNode,
    { readonly kind: "paragraph" | "heading" | "blockquote" }
  >,
  context: PreviewRenderContext
): void => {
  if (node.style.paragraph === undefined) {
    context.diagnostics.push(
      createPreviewDiagnostic({
        severity: "warning",
        code: "preview.style.fallback",
        message: `Для элемента "${node.kind}" использован fallback-стиль предпросмотра.`,
        source: node.source,
        path: node.path
      })
    );
  }

  if (node.style.paragraph?.pageBreakBefore === true) {
    context.diagnostics.push(
      createPreviewDiagnostic({
        severity: "warning",
        code: "preview.fidelity.pageBreakApproximation",
        message: "Разбиение на страницы является приблизительным.",
        source: node.source,
        path: node.path
      })
    );
  }

  for (const property of ["keepNext", "keepLines", "widowControl"] as const) {
    if (node.style.paragraph?.[property] !== undefined) {
      context.diagnostics.push(
        createPreviewDiagnostic({
          severity: "warning",
          code: "preview.fidelity.unsupportedProperty",
          message: `Свойство "${property}" не поддерживается fast preview и было проигнорировано.`,
          source: node.source,
          path: node.path,
          metadata: { property }
        })
      );
    }
  }
};

const diagnoseRunFidelity = (
  node: ResolvedInlineNode,
  context: PreviewRenderContext
): void => {
  if (node.style.run === undefined) {
    context.diagnostics.push(
      createPreviewDiagnostic({
        severity: "warning",
        code: "preview.style.fallback",
        message: `Для элемента "${node.kind}" использован fallback-стиль предпросмотра.`,
        source: node.source,
        path: node.path
      })
    );
    return;
  }

  if (node.style.run.font === undefined) {
    context.diagnostics.push(
      createPreviewDiagnostic({
        severity: "warning",
        code: "preview.fidelity.fontFallback",
        message:
          "Шрифт не указан в resolved model. В предпросмотре используется fallback браузера.",
        source: node.source,
        path: node.path
      })
    );
  }
};

const renderList = (
  tag: "ul" | "ol",
  node: ResolvedOrderedListNode | ResolvedUnorderedListNode,
  context: PreviewRenderContext
): string =>
  `<${tag} class="md2docx-list md2docx-${tag === "ol" ? "ordered" : "unordered"}-list" style="${listStyleToCss(node.style)}">${node.children.map((item) => renderListItem(item, context)).join("")}</${tag}>`;

const renderListItem = (
  node: ResolvedListItemNode,
  context: PreviewRenderContext
): string =>
  `<li class="md2docx-list-item" style="${paragraphStyleToCss(node.style)}">${node.children.map((child) => renderBlock(child, context)).join("")}</li>`;

const renderTableCell = (
  cell: ResolvedTableCellNode,
  context: PreviewRenderContext
): string => {
  const tag = cell.isHeader ? "th" : "td";

  return `<${tag} class="md2docx-table-cell" style="${tableCellStyleToCss(cell.style)}">${cell.children.map((child) => renderBlock(child, context)).join("")}</${tag}>`;
};

const renderImage = (
  src: string,
  alt: string | undefined,
  title: string | undefined,
  style: ResolvedInlineNode["style"],
  context: PreviewRenderContext,
  source: ResolvedInlineNode["source"],
  path: ResolvedInlineNode["path"]
): string => {
  const safeSrc = src.length === 0 ? undefined : safeImageSrc(src, context, source, path);
  const safeAlt = escapeAttribute({
    value: alt ?? "Изображение",
    context,
    source,
    path
  });

  context.diagnostics.push(
    createPreviewDiagnostic({
      severity: "warning",
      code: "preview.fidelity.imageApproximation",
      message:
        "Отображение изображения в fast preview является приблизительным.",
      source,
      path
    })
  );

  if (safeSrc === undefined) {
    return `<span class="md2docx-image-placeholder">${safeAlt}</span>`;
  }

  return `<img class="md2docx-image" src="${safeSrc}" alt="${safeAlt}"${title === undefined ? "" : ` title="${escapeAttribute({ value: title, context, source, path })}"`} style="${imageStyleToCss(style)}">`;
};
