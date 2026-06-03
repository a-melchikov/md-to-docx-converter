import { Paragraph, Table, TableCell, TableRow } from "docx";
import type {
  ResolvedBlockNode,
  ResolvedTableCellNode,
  ResolvedTableNode,
  ResolvedTableRowNode
} from "@md-to-docx/domain";

import type { DocxBuilderContext } from "./builder-context.js";
import { blocksToFileChildren } from "./document-builder.js";
import { tableCellOptionsFromStyle, tableOptionsFromStyle } from "./style-mappers.js";

export const tableFromNode = (
  node: ResolvedTableNode,
  context: DocxBuilderContext
): Table =>
  new Table({
    rows: node.children.map((row) => tableRowFromNode(row, context)),
    ...tableOptionsFromStyle(node.style)
  });

const tableRowFromNode = (
  node: ResolvedTableRowNode,
  context: DocxBuilderContext
): TableRow =>
  new TableRow({
    children: node.children.map((cell) => tableCellFromNode(cell, context))
  });

const tableCellFromNode = (
  node: ResolvedTableCellNode,
  context: DocxBuilderContext
): TableCell =>
  new TableCell({
    children: blockChildrenAsCellChildren(node.children, context),
    ...tableCellOptionsFromStyle(node.style)
  });

const blockChildrenAsCellChildren = (
  children: readonly ResolvedBlockNode[],
  context: DocxBuilderContext
): readonly Paragraph[] => {
  const rendered = blocksToFileChildren(children, context);
  const paragraphs = rendered.filter(
    (child): child is Paragraph => child instanceof Paragraph
  );

  return paragraphs.length === 0 ? [new Paragraph("")] : paragraphs;
};
