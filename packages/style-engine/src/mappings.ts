import type {
  BlockNode,
  HeadingNode,
  InlineNode
} from "@md-to-docx/domain";
import type { RunProperties, StyleDefinition, StylesConfig } from "@md-to-docx/config-schema";

export type StyleKey = keyof StylesConfig;

export const blockStyleKey = (node: BlockNode): StyleKey | undefined => {
  switch (node.kind) {
    case "paragraph":
      return "paragraph";
    case "heading":
      return headingStyleKey(node);
    case "blockquote":
      return "blockquote";
    case "unordered-list":
      return "unorderedList";
    case "ordered-list":
      return "orderedList";
    case "list-item":
      return "listItem";
    case "code-block":
      return "codeBlock";
    case "thematic-break":
      return "thematicBreak";
    case "table":
      return "table";
    case "table-cell":
      return "tableCell";
    case "image-block":
      return "image";
    case "table-row":
    case "unsupported-block":
      return undefined;
  }
};

export const tableCellStyleKey = (isHeader: boolean): StyleKey =>
  isHeader ? "tableHeader" : "tableCell";

export const inlineStyleKey = (node: InlineNode): StyleKey | undefined => {
  switch (node.kind) {
    case "inline-code":
      return "inlineCode";
    case "link":
      return "link";
    case "inline-image":
      return "image";
    case "text":
    case "strong":
    case "emphasis":
    case "strikethrough":
    case "hard-break":
    case "soft-break":
    case "unsupported-inline":
      return undefined;
  }
};

export const intrinsicInlineStyle = (
  node: InlineNode
): StyleDefinition | undefined => {
  const run = intrinsicRunStyle(node);

  return run === undefined ? undefined : { run };
};

const intrinsicRunStyle = (node: InlineNode): RunProperties | undefined => {
  switch (node.kind) {
    case "strong":
      return { bold: true };
    case "emphasis":
      return { italic: true };
    case "strikethrough":
      return { strike: true };
    case "text":
    case "inline-code":
    case "link":
    case "inline-image":
    case "hard-break":
    case "soft-break":
    case "unsupported-inline":
      return undefined;
  }
};

const headingStyleKey = (node: HeadingNode): StyleKey =>
  `heading${node.level}` as StyleKey;
