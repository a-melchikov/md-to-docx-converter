import type { DocumentPath, SourceLocation } from "./source.js";

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue | undefined };

export type NodeAttributes = Record<string, JsonValue | undefined>;

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type TableCellAlignment = "left" | "center" | "right" | "justify";

export interface DocumentNodeBase<TKind extends string> {
  readonly kind: TKind;
  readonly id?: string;
  readonly source?: SourceLocation;
  readonly path?: DocumentPath;
  readonly attrs?: NodeAttributes;
}

export interface DocumentNode extends DocumentNodeBase<"document"> {
  readonly children: readonly BlockNode[];
  readonly metadata?: NodeAttributes;
}

export interface ParagraphNode extends DocumentNodeBase<"paragraph"> {
  readonly children: readonly InlineNode[];
}

export interface HeadingNode extends DocumentNodeBase<"heading"> {
  readonly level: HeadingLevel;
  readonly children: readonly InlineNode[];
}

export interface BlockquoteNode extends DocumentNodeBase<"blockquote"> {
  readonly children: readonly BlockNode[];
}

export interface UnorderedListNode extends DocumentNodeBase<"unordered-list"> {
  readonly children: readonly ListItemNode[];
}

export interface OrderedListNode extends DocumentNodeBase<"ordered-list"> {
  readonly start?: number;
  readonly children: readonly ListItemNode[];
}

export interface ListItemNode extends DocumentNodeBase<"list-item"> {
  readonly checked?: boolean | null;
  readonly children: readonly BlockNode[];
}

export interface CodeBlockNode extends DocumentNodeBase<"code-block"> {
  readonly value: string;
  readonly language?: string;
}

export type ThematicBreakNode = DocumentNodeBase<"thematic-break">;

export interface TableNode extends DocumentNodeBase<"table"> {
  readonly align?: readonly (TableCellAlignment | null)[];
  readonly children: readonly TableRowNode[];
}

export interface TableRowNode extends DocumentNodeBase<"table-row"> {
  readonly children: readonly TableCellNode[];
}

export interface TableCellNode extends DocumentNodeBase<"table-cell"> {
  readonly children: readonly BlockNode[];
}

export interface ImageBlockNode extends DocumentNodeBase<"image-block"> {
  readonly src: string;
  readonly alt?: string;
  readonly title?: string;
}

export interface UnsupportedBlockNode
  extends DocumentNodeBase<"unsupported-block"> {
  readonly originalType: string;
  readonly reason?: string;
  readonly fallbackText?: string;
}

export type BlockNode =
  | ParagraphNode
  | HeadingNode
  | BlockquoteNode
  | UnorderedListNode
  | OrderedListNode
  | ListItemNode
  | CodeBlockNode
  | ThematicBreakNode
  | TableNode
  | TableRowNode
  | TableCellNode
  | ImageBlockNode
  | UnsupportedBlockNode;

export interface TextNode extends DocumentNodeBase<"text"> {
  readonly value: string;
}

export interface StrongNode extends DocumentNodeBase<"strong"> {
  readonly children: readonly InlineNode[];
}

export interface EmphasisNode extends DocumentNodeBase<"emphasis"> {
  readonly children: readonly InlineNode[];
}

export interface StrikethroughNode extends DocumentNodeBase<"strikethrough"> {
  readonly children: readonly InlineNode[];
}

export interface InlineCodeNode extends DocumentNodeBase<"inline-code"> {
  readonly value: string;
}

export interface LinkNode extends DocumentNodeBase<"link"> {
  readonly href: string;
  readonly title?: string;
  readonly children: readonly InlineNode[];
}

export interface InlineImageNode extends DocumentNodeBase<"inline-image"> {
  readonly src: string;
  readonly alt?: string;
  readonly title?: string;
}

export type HardBreakNode = DocumentNodeBase<"hard-break">;

export type SoftBreakNode = DocumentNodeBase<"soft-break">;

export interface UnsupportedInlineNode
  extends DocumentNodeBase<"unsupported-inline"> {
  readonly originalType: string;
  readonly reason?: string;
  readonly fallbackText?: string;
}

export type InlineNode =
  | TextNode
  | StrongNode
  | EmphasisNode
  | StrikethroughNode
  | InlineCodeNode
  | LinkNode
  | InlineImageNode
  | HardBreakNode
  | SoftBreakNode
  | UnsupportedInlineNode;

export type IntermediateNode = DocumentNode | BlockNode | InlineNode;
