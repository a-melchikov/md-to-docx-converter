import {
  ExternalHyperlink,
  TextRun,
  type ParagraphChild
} from "docx";
import type { ResolvedInlineNode, ResolvedStyleSet } from "@md-to-docx/domain";

import type { DocxBuilderContext } from "./builder-context.js";
import { createDocxDiagnostic, unsupportedNodeMessage } from "./diagnostics.js";
import { imageRunForNode } from "./image-builder.js";
import { runOptionsFromStyle } from "./style-mappers.js";

export const runsFromInlineNodes = (
  nodes: readonly ResolvedInlineNode[],
  context: DocxBuilderContext
): readonly ParagraphChild[] => nodes.flatMap((node) => runFromInlineNode(node, context));

export const runFromInlineNode = (
  node: ResolvedInlineNode,
  context: DocxBuilderContext
): readonly ParagraphChild[] => {
  switch (node.kind) {
    case "text":
      return [
        new TextRun({
          text: node.value,
          ...runOptionsFromStyle(node.style, context, node.kind)
        })
      ];
    case "strong":
    case "emphasis":
    case "strikethrough":
      return runsFromInlineNodes(node.children, context);
    case "inline-code":
      return [
        new TextRun({
          text: node.value,
          ...runOptionsFromStyle(node.style, context, node.kind)
        })
      ];
    case "link":
      return [
        new ExternalHyperlink({
          link: node.href,
          children: runsFromInlineNodes(node.children, context)
        })
      ];
    case "inline-image":
      return imageRunForNode(node, context);
    case "hard-break":
      return [new TextRun({ break: 1 })];
    case "soft-break":
      return [new TextRun({ text: " " })];
    case "unsupported-inline":
      context.diagnostics.push(
        createDocxDiagnostic({
          severity: "warning",
          code: "docx.node.unsupported",
          message: unsupportedNodeMessage(node.originalType),
          source: node.source,
          path: node.path,
          metadata: { nodeKind: node.kind, originalType: node.originalType }
        })
      );

      return unsupportedInlineFallback(node, context);
  }
};

export const textRunsForLines = (
  value: string,
  style: ResolvedStyleSet,
  context: DocxBuilderContext,
  kind: string
): readonly ParagraphChild[] =>
  value.split("\n").flatMap((line, index) => [
    ...(index === 0 ? [] : [new TextRun({ break: 1 })]),
    new TextRun({
      text: line,
      ...runOptionsFromStyle(style, context, kind)
    })
  ]);

const unsupportedInlineFallback = (
  node: Extract<ResolvedInlineNode, { readonly kind: "unsupported-inline" }>,
  context: DocxBuilderContext
): readonly ParagraphChild[] => {
  const text = node.fallbackText ?? node.originalType;

  return [
    new TextRun({
      text,
      ...runOptionsFromStyle(node.style, context, node.kind, false)
    })
  ];
};
