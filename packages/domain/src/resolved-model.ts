import type {
  BlockNode,
  HeadingLevel,
  InlineNode,
  JsonValue,
  NodeAttributes,
  TableCellAlignment
} from "./document-model.js";
import type { DocumentPath, SourceLocation } from "./source.js";
import type { Emu, HalfPoint, Pct, Twip } from "./units.js";

export type ResolvedParagraphAlignment =
  | "left"
  | "center"
  | "right"
  | "both"
  | "justify";

export type ResolvedLineRule = "auto" | "exact" | "atLeast";

export type ResolvedUnderlineStyle = "none" | "single" | "double";

export type ResolvedBorderStyle =
  | "none"
  | "single"
  | "double"
  | "dashed"
  | "dotted";

export type ResolvedLevelFormat =
  | "bullet"
  | "decimal"
  | "lowerLetter"
  | "upperLetter"
  | "lowerRoman"
  | "upperRoman";

export interface ResolvedFontProperties {
  readonly ascii?: string | undefined;
  readonly hAnsi?: string | undefined;
  readonly cs?: string | undefined;
  readonly eastAsia?: string | undefined;
}

export interface ResolvedParagraphSpacing {
  readonly beforeTwip?: Twip | undefined;
  readonly afterTwip?: Twip | undefined;
  readonly lineTwip?: Twip | undefined;
  readonly lineRule?: ResolvedLineRule | undefined;
}

export interface ResolvedParagraphIndentation {
  readonly leftTwip?: Twip | undefined;
  readonly rightTwip?: Twip | undefined;
  readonly firstLineTwip?: Twip | undefined;
  readonly hangingTwip?: Twip | undefined;
}

export interface ResolvedParagraphProperties {
  readonly alignment?: ResolvedParagraphAlignment | undefined;
  readonly spacing?: ResolvedParagraphSpacing | undefined;
  readonly indentation?: ResolvedParagraphIndentation | undefined;
  readonly keepNext?: boolean | undefined;
  readonly keepLines?: boolean | undefined;
  readonly widowControl?: boolean | undefined;
  readonly pageBreakBefore?: boolean | undefined;
}

export interface ResolvedRunProperties {
  readonly font?: ResolvedFontProperties | undefined;
  readonly sizeHalfPt?: HalfPoint | undefined;
  readonly bold?: boolean | undefined;
  readonly italic?: boolean | undefined;
  readonly underline?: ResolvedUnderlineStyle | undefined;
  readonly strike?: boolean | undefined;
  readonly color?: string | undefined;
  readonly highlight?: string | undefined;
  readonly smallCaps?: boolean | undefined;
  readonly allCaps?: boolean | undefined;
  readonly superscript?: boolean | undefined;
  readonly subscript?: boolean | undefined;
}

export interface ResolvedBorderProperties {
  readonly style?: ResolvedBorderStyle | undefined;
  readonly color?: string | undefined;
  readonly sizeTwip?: Twip | undefined;
}

export interface ResolvedShadingProperties {
  readonly fill?: string | undefined;
}

export interface ResolvedTableProperties {
  readonly widthPct?: Pct | undefined;
  readonly cellMarginTwip?: Twip | undefined;
  readonly border?: ResolvedBorderProperties | undefined;
  readonly shading?: ResolvedShadingProperties | undefined;
}

export interface ResolvedImageProperties {
  readonly maxWidthEmu?: Emu | undefined;
  readonly maxHeightEmu?: Emu | undefined;
  readonly preserveAspectRatio?: boolean | undefined;
}

export interface ResolvedStyleSet {
  readonly paragraph?: ResolvedParagraphProperties | undefined;
  readonly run?: ResolvedRunProperties | undefined;
  readonly table?: ResolvedTableProperties | undefined;
  readonly image?: ResolvedImageProperties | undefined;
  readonly border?: ResolvedBorderProperties | undefined;
  readonly shading?: ResolvedShadingProperties | undefined;
}

export interface ResolvedNumberingLevel {
  readonly level: number;
  readonly format: ResolvedLevelFormat;
  readonly text: string;
  readonly start?: number | undefined;
  readonly leftTwip: Twip;
  readonly hangingTwip: Twip;
}

export interface ResolvedNumberingInfo {
  readonly kind: "ordered" | "unordered";
  readonly level: number;
  readonly itemIndex?: number | undefined;
  readonly checked?: boolean | null | undefined;
  readonly levelConfig?: ResolvedNumberingLevel | undefined;
}

export interface ResolvedPageSize {
  readonly preset: "A4" | "A3" | "Letter" | "Legal" | "custom";
  readonly orientation: "portrait" | "landscape";
  readonly widthTwip?: Twip | undefined;
  readonly heightTwip?: Twip | undefined;
}

export interface ResolvedPageMargin {
  readonly topTwip: Twip;
  readonly rightTwip: Twip;
  readonly bottomTwip: Twip;
  readonly leftTwip: Twip;
}

export interface ResolvedColumns {
  readonly count: number;
  readonly spacingTwip?: Twip | undefined;
}

export interface ResolvedDocumentProperties {
  readonly page: {
    readonly size: ResolvedPageSize;
    readonly margin: ResolvedPageMargin;
  };
  readonly columns: ResolvedColumns;
  readonly metadata: Record<string, JsonValue | undefined>;
}

export interface ResolvedNodeBase<TKind extends string> {
  readonly kind: TKind;
  readonly sourceKind: BlockNode["kind"] | InlineNode["kind"] | "document";
  readonly source?: SourceLocation | undefined;
  readonly path?: DocumentPath | undefined;
  readonly attrs?: NodeAttributes | undefined;
  readonly style: ResolvedStyleSet;
}

export interface ResolvedDocument extends ResolvedNodeBase<"document"> {
  readonly properties: ResolvedDocumentProperties;
  readonly children: readonly ResolvedBlockNode[];
  readonly metadata?: NodeAttributes | undefined;
}

export interface ResolvedParagraphNode extends ResolvedNodeBase<"paragraph"> {
  readonly children: readonly ResolvedInlineNode[];
}

export interface ResolvedHeadingNode extends ResolvedNodeBase<"heading"> {
  readonly level: HeadingLevel;
  readonly children: readonly ResolvedInlineNode[];
}

export interface ResolvedBlockquoteNode
  extends ResolvedNodeBase<"blockquote"> {
  readonly children: readonly ResolvedBlockNode[];
}

export interface ResolvedUnorderedListNode
  extends ResolvedNodeBase<"unordered-list"> {
  readonly numbering: ResolvedNumberingInfo;
  readonly children: readonly ResolvedListItemNode[];
}

export interface ResolvedOrderedListNode
  extends ResolvedNodeBase<"ordered-list"> {
  readonly start?: number | undefined;
  readonly numbering: ResolvedNumberingInfo;
  readonly children: readonly ResolvedListItemNode[];
}

export interface ResolvedListItemNode extends ResolvedNodeBase<"list-item"> {
  readonly checked?: boolean | null | undefined;
  readonly numbering?: ResolvedNumberingInfo | undefined;
  readonly children: readonly ResolvedBlockNode[];
}

export interface ResolvedCodeBlockNode
  extends ResolvedNodeBase<"code-block"> {
  readonly value: string;
  readonly language?: string | undefined;
}

export type ResolvedThematicBreakNode =
  ResolvedNodeBase<"thematic-break">;

export interface ResolvedTableNode extends ResolvedNodeBase<"table"> {
  readonly align?: readonly (TableCellAlignment | null)[] | undefined;
  readonly children: readonly ResolvedTableRowNode[];
}

export interface ResolvedTableRowNode extends ResolvedNodeBase<"table-row"> {
  readonly children: readonly ResolvedTableCellNode[];
}

export interface ResolvedTableCellNode extends ResolvedNodeBase<"table-cell"> {
  readonly isHeader: boolean;
  readonly children: readonly ResolvedBlockNode[];
}

export interface ResolvedImageBlockNode
  extends ResolvedNodeBase<"image-block"> {
  readonly src: string;
  readonly alt?: string | undefined;
  readonly title?: string | undefined;
}

export interface ResolvedUnsupportedBlockNode
  extends ResolvedNodeBase<"unsupported-block"> {
  readonly originalType: string;
  readonly reason?: string | undefined;
  readonly fallbackText?: string | undefined;
}

export type ResolvedBlockNode =
  | ResolvedParagraphNode
  | ResolvedHeadingNode
  | ResolvedBlockquoteNode
  | ResolvedUnorderedListNode
  | ResolvedOrderedListNode
  | ResolvedListItemNode
  | ResolvedCodeBlockNode
  | ResolvedThematicBreakNode
  | ResolvedTableNode
  | ResolvedTableRowNode
  | ResolvedTableCellNode
  | ResolvedImageBlockNode
  | ResolvedUnsupportedBlockNode;

export interface ResolvedTextNode extends ResolvedNodeBase<"text"> {
  readonly value: string;
}

export interface ResolvedStrongNode extends ResolvedNodeBase<"strong"> {
  readonly children: readonly ResolvedInlineNode[];
}

export interface ResolvedEmphasisNode extends ResolvedNodeBase<"emphasis"> {
  readonly children: readonly ResolvedInlineNode[];
}

export interface ResolvedStrikethroughNode
  extends ResolvedNodeBase<"strikethrough"> {
  readonly children: readonly ResolvedInlineNode[];
}

export interface ResolvedInlineCodeNode
  extends ResolvedNodeBase<"inline-code"> {
  readonly value: string;
}

export interface ResolvedLinkNode extends ResolvedNodeBase<"link"> {
  readonly href: string;
  readonly title?: string | undefined;
  readonly children: readonly ResolvedInlineNode[];
}

export interface ResolvedInlineImageNode
  extends ResolvedNodeBase<"inline-image"> {
  readonly src: string;
  readonly alt?: string | undefined;
  readonly title?: string | undefined;
}

export type ResolvedHardBreakNode = ResolvedNodeBase<"hard-break">;

export type ResolvedSoftBreakNode = ResolvedNodeBase<"soft-break">;

export interface ResolvedUnsupportedInlineNode
  extends ResolvedNodeBase<"unsupported-inline"> {
  readonly originalType: string;
  readonly reason?: string | undefined;
  readonly fallbackText?: string | undefined;
}

export type ResolvedInlineNode =
  | ResolvedTextNode
  | ResolvedStrongNode
  | ResolvedEmphasisNode
  | ResolvedStrikethroughNode
  | ResolvedInlineCodeNode
  | ResolvedLinkNode
  | ResolvedInlineImageNode
  | ResolvedHardBreakNode
  | ResolvedSoftBreakNode
  | ResolvedUnsupportedInlineNode;
