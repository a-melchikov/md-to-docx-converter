import {
  HeadingLevel,
  Paragraph,
  TextRun,
  type IParagraphOptions
} from "docx";
import type {
  HeadingLevel as DomainHeadingLevel,
  ResolvedCodeBlockNode,
  ResolvedHeadingNode,
  ResolvedListItemNode,
  ResolvedNumberingInfo,
  ResolvedParagraphNode,
  ResolvedStyleSet
} from "@md-to-docx/domain";

import type { DocxBuilderContext } from "./builder-context.js";
import { imageRunForNode } from "./image-builder.js";
import { numberingParagraphOptions } from "./list-builder.js";
import { runsFromInlineNodes, textRunsForLines } from "./run-builder.js";
import { paragraphOptionsFromStyle } from "./style-mappers.js";

export const paragraphFromNode = (
  node: ResolvedParagraphNode,
  context: DocxBuilderContext,
  options: {
    readonly styleOverride?: ResolvedStyleSet | undefined;
    readonly numbering?: ResolvedNumberingInfo | undefined;
  } = {}
): Paragraph =>
  new Paragraph({
    children: runsFromInlineNodes(node.children, context),
    ...paragraphOptionsFromStyle(
      options.styleOverride ?? node.style,
      context,
      node.kind
    ),
    ...(options.numbering === undefined
      ? {}
      : { numbering: numberingParagraphOptions(options.numbering, context) })
  });

export const headingFromNode = (
  node: ResolvedHeadingNode,
  context: DocxBuilderContext
): Paragraph =>
  new Paragraph({
    children: runsFromInlineNodes(node.children, context),
    heading: mapHeadingLevel(node.level),
    ...paragraphOptionsFromStyle(node.style, context, node.kind)
  });

export const codeBlockParagraphs = (
  node: ResolvedCodeBlockNode,
  context: DocxBuilderContext
): readonly Paragraph[] => [
  new Paragraph({
    children: textRunsForLines(node.value, node.style, context, node.kind),
    ...paragraphOptionsFromStyle(node.style, context, node.kind)
  })
];

export const imageParagraph = (
  node: Parameters<typeof imageRunForNode>[0],
  context: DocxBuilderContext
): Paragraph =>
  new Paragraph({
    children: imageRunForNode(node, context),
    ...paragraphOptionsFromStyle(node.style, context, node.kind, false)
  });

export const listItemFallbackParagraph = (
  node: ResolvedListItemNode,
  context: DocxBuilderContext,
  numbering?: ResolvedNumberingInfo | undefined
): Paragraph =>
  new Paragraph({
    children: [new TextRun({ text: node.checked === true ? "[x]" : "" })],
    ...paragraphOptionsFromStyle(node.style, context, node.kind),
    ...(numbering === undefined
      ? {}
      : { numbering: numberingParagraphOptions(numbering, context) })
  });

export const paragraphFromText = (
  text: string,
  style: ResolvedStyleSet,
  context: DocxBuilderContext,
  options: Omit<IParagraphOptions, "children" | "text"> = {}
): Paragraph =>
  new Paragraph({
    children: [new TextRun({ text })],
    ...paragraphOptionsFromStyle(style, context, "fallback", false),
    ...options
  });

const mapHeadingLevel = (level: DomainHeadingLevel) => {
  switch (level) {
    case 1:
      return HeadingLevel.HEADING_1;
    case 2:
      return HeadingLevel.HEADING_2;
    case 3:
      return HeadingLevel.HEADING_3;
    case 4:
      return HeadingLevel.HEADING_4;
    case 5:
      return HeadingLevel.HEADING_5;
    case 6:
      return HeadingLevel.HEADING_6;
  }
};
