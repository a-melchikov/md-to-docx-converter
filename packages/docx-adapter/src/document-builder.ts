import {
  Document,
  Paragraph,
  PageOrientation,
  type FileChild
} from "docx";
import type {
  ResolvedBlockNode,
  ResolvedBlockquoteNode,
  ResolvedDocument,
  ResolvedListItemNode,
  ResolvedNumberingInfo,
  ResolvedOrderedListNode,
  ResolvedStyleSet,
  ResolvedUnorderedListNode
} from "@md-to-docx/domain";

import type { DocxBuilderContext } from "./builder-context.js";
import { createDocxDiagnostic, unsupportedNodeMessage } from "./diagnostics.js";
import { numberingOptions } from "./list-builder.js";
import {
  codeBlockParagraphs,
  headingFromNode,
  imageParagraph,
  listItemFallbackParagraph,
  paragraphFromNode,
  paragraphFromText
} from "./paragraph-builder.js";
import { tableFromNode } from "./table-builder.js";

export interface BuildDocxDocumentInput {
  readonly document: ResolvedDocument;
  readonly creator?: string | undefined;
  readonly subject?: string | undefined;
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly context: DocxBuilderContext;
}

export const buildDocxDocument = (input: BuildDocxDocumentInput): Document => {
  const children = blocksToFileChildren(input.document.children, input.context);

  const title = input.title ?? stringMetadata(input.document, "title");
  const subject = input.subject ?? stringMetadata(input.document, "subject");
  const creator = input.creator ?? stringMetadata(input.document, "creator");
  const description =
    input.description ?? stringMetadata(input.document, "description");

  return new Document({
    ...(title === undefined ? {} : { title }),
    ...(subject === undefined ? {} : { subject }),
    ...(creator === undefined ? {} : { creator }),
    ...(description === undefined ? {} : { description }),
    numbering: numberingOptions(input.document),
    sections: [
      {
        properties: {
          page: {
            size: {
              ...(input.document.properties.page.size.widthTwip === undefined ||
              input.document.properties.page.size.heightTwip === undefined
                ? {}
                : {
                    width: input.document.properties.page.size.widthTwip,
                    height: input.document.properties.page.size.heightTwip
                  }),
              orientation:
                input.document.properties.page.size.orientation === "landscape"
                  ? PageOrientation.LANDSCAPE
                  : PageOrientation.PORTRAIT
            },
            margin: {
              top: input.document.properties.page.margin.topTwip,
              right: input.document.properties.page.margin.rightTwip,
              bottom: input.document.properties.page.margin.bottomTwip,
              left: input.document.properties.page.margin.leftTwip
            }
          },
          column: {
            count: input.document.properties.columns.count,
            ...(input.document.properties.columns.spacingTwip === undefined
              ? {}
              : { space: input.document.properties.columns.spacingTwip })
          }
        },
        children: children.length === 0 ? [new Paragraph("")] : children
      }
    ]
  });
};

export const blocksToFileChildren = (
  nodes: readonly ResolvedBlockNode[],
  context: DocxBuilderContext,
  options: {
    readonly numbering?: ResolvedNumberingInfo | undefined;
    readonly styleOverride?: ResolvedStyleSet | undefined;
  } = {}
): readonly FileChild[] =>
  nodes.flatMap((node) => blockToFileChildren(node, context, options));

const blockToFileChildren = (
  node: ResolvedBlockNode,
  context: DocxBuilderContext,
  options: {
    readonly numbering?: ResolvedNumberingInfo | undefined;
    readonly styleOverride?: ResolvedStyleSet | undefined;
  }
): readonly FileChild[] => {
  switch (node.kind) {
    case "paragraph":
      return [
        paragraphFromNode(node, context, {
          styleOverride: options.styleOverride,
          numbering: options.numbering
        })
      ];
    case "heading":
      return [headingFromNode(node, context)];
    case "blockquote":
      return blockquoteChildren(node, context);
    case "unordered-list":
      return listChildren(node, context);
    case "ordered-list":
      return listChildren(node, context);
    case "list-item":
      return listItemChildren(node, context, options.numbering);
    case "code-block":
      return codeBlockParagraphs(node, context);
    case "thematic-break":
      return [
        new Paragraph({
          border: {
            bottom: {
              style: "single",
              color: node.style.border?.color ?? "808080",
              size: node.style.border?.sizeTwip ?? 4
            }
          }
        })
      ];
    case "table":
      return [tableFromNode(node, context)];
    case "table-row":
    case "table-cell":
      context.diagnostics.push(
        createDocxDiagnostic({
          severity: "warning",
          code: "docx.node.unsupported",
          message: unsupportedNodeMessage(node.kind),
          source: node.source,
          path: node.path,
          metadata: { nodeKind: node.kind }
        })
      );
      return [];
    case "image-block":
      return [imageParagraph(node, context)];
    case "unsupported-block":
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
      return [
        paragraphFromText(
          node.fallbackText ?? node.originalType,
          node.style,
          context
        )
      ];
  }
};

const blockquoteChildren = (
  node: ResolvedBlockquoteNode,
  context: DocxBuilderContext
): readonly FileChild[] =>
  blocksToFileChildren(node.children, context, { styleOverride: node.style });

const listChildren = (
  node: ResolvedUnorderedListNode | ResolvedOrderedListNode,
  context: DocxBuilderContext
): readonly FileChild[] =>
  node.children.flatMap((child) =>
    listItemChildren(child, context, child.numbering ?? node.numbering)
  );

const listItemChildren = (
  node: ResolvedListItemNode,
  context: DocxBuilderContext,
  numbering?: ResolvedNumberingInfo | undefined
): readonly FileChild[] => {
  if (node.children.length === 0) {
    return [listItemFallbackParagraph(node, context, numbering)];
  }

  return node.children.flatMap((child, index) => {
    if (child.kind === "unordered-list" || child.kind === "ordered-list") {
      return blockToFileChildren(child, context, {});
    }

    return blockToFileChildren(child, context, {
      numbering: index === 0 ? numbering : undefined
    });
  });
};

const stringMetadata = (
  document: ResolvedDocument,
  key: string
): string | undefined => {
  const value = document.properties.metadata[key];

  return typeof value === "string" ? value : undefined;
};
