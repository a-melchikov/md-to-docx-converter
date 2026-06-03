export type MarkdownProfile = "commonmark" | "commonmark-gfm";

export type UnsupportedNodePolicy = "warn-and-skip" | "error" | "fallback-text";

export type InvalidXmlCharPolicy =
  | "warn-and-skip"
  | "error"
  | "replace-uFFFD";

export type HtmlPolicy = "warn-and-skip" | "error" | "fallback-text";

export type PageSizePreset = "A4" | "A3" | "Letter" | "Legal" | "custom";

export type PageOrientation = "portrait" | "landscape";

export type ParagraphAlignment =
  | "left"
  | "center"
  | "right"
  | "both"
  | "justify";

export type LineRule = "auto" | "exact" | "atLeast";

export type UnderlineStyle = "none" | "single" | "double";

export type LevelFormat =
  | "bullet"
  | "decimal"
  | "lowerLetter"
  | "upperLetter"
  | "lowerRoman"
  | "upperRoman";

export type BorderStyle =
  | "none"
  | "single"
  | "double"
  | "dashed"
  | "dotted";

export interface ConverterConfig {
  readonly version: string;
  readonly meta?: ConfigMeta;
  readonly input: InputConfig;
  readonly document: DocumentConfig;
  readonly defaults: DefaultsConfig;
  readonly styles: StylesConfig;
  readonly numbering: NumberingConfig;
  readonly headersFooters: HeadersFootersConfig;
  readonly advanced: AdvancedConfig;
}

export interface ConfigMeta {
  readonly name?: string;
  readonly description?: string;
  readonly locale?: string;
  readonly author?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface InputConfig {
  readonly markdownProfile: MarkdownProfile;
  readonly enableHtmlSubset: boolean;
  readonly enableMermaid: boolean;
  readonly htmlPolicy: HtmlPolicy;
  readonly onUnsupportedNode: UnsupportedNodePolicy;
  readonly onInvalidXmlChar: InvalidXmlCharPolicy;
}

export interface DocumentConfig {
  readonly page: PageConfig;
  readonly columns: ColumnsConfig;
  readonly metadata: DocumentMetadataConfig;
}

export interface PageConfig {
  readonly size: PageSizeConfig;
  readonly margin: PageMarginConfig;
}

export interface PageSizeConfig {
  readonly preset: PageSizePreset;
  readonly orientation: PageOrientation;
  readonly widthTwip?: number;
  readonly heightTwip?: number;
}

export interface PageMarginConfig {
  readonly topTwip: number;
  readonly rightTwip: number;
  readonly bottomTwip: number;
  readonly leftTwip: number;
}

export interface ColumnsConfig {
  readonly count: number;
  readonly spacingTwip?: number;
}

export interface DocumentMetadataConfig {
  readonly title?: string;
  readonly subject?: string;
  readonly creator?: string;
  readonly keywords?: readonly string[];
  readonly category?: string;
  readonly description?: string;
  readonly language?: string;
}

export interface DefaultsConfig {
  readonly paragraph: ParagraphProperties;
  readonly run: RunProperties;
  readonly table: TableProperties;
  readonly image: ImageProperties;
}

export interface ParagraphProperties {
  readonly alignment?: ParagraphAlignment;
  readonly spacing?: ParagraphSpacing;
  readonly indentation?: ParagraphIndentation;
  readonly keepNext?: boolean;
  readonly keepLines?: boolean;
  readonly widowControl?: boolean;
  readonly pageBreakBefore?: boolean;
}

export interface ParagraphSpacing {
  readonly beforeTwip?: number;
  readonly afterTwip?: number;
  readonly lineTwip?: number;
  readonly lineRule?: LineRule;
}

export interface ParagraphIndentation {
  readonly leftTwip?: number;
  readonly rightTwip?: number;
  readonly firstLineTwip?: number;
  readonly hangingTwip?: number;
}

export interface RunProperties {
  readonly font?: FontProperties;
  readonly sizeHalfPt?: number;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly underline?: UnderlineStyle;
  readonly strike?: boolean;
  readonly color?: string;
  readonly highlight?: string;
  readonly smallCaps?: boolean;
  readonly allCaps?: boolean;
  readonly superscript?: boolean;
  readonly subscript?: boolean;
}

export interface FontProperties {
  readonly ascii?: string;
  readonly hAnsi?: string;
  readonly cs?: string;
  readonly eastAsia?: string;
}

export interface TableProperties {
  readonly widthPct?: number;
  readonly cellMarginTwip?: number;
  readonly border?: BorderProperties;
  readonly shading?: ShadingProperties;
}

export interface ImageProperties {
  readonly maxWidthEmu?: number;
  readonly maxHeightEmu?: number;
  readonly preserveAspectRatio?: boolean;
}

export interface BorderProperties {
  readonly style?: BorderStyle;
  readonly color?: string;
  readonly sizeTwip?: number;
}

export interface ShadingProperties {
  readonly fill?: string;
}

export interface StyleDefinition {
  readonly paragraph?: ParagraphProperties;
  readonly run?: RunProperties;
  readonly table?: TableProperties;
  readonly image?: ImageProperties;
  readonly border?: BorderProperties;
  readonly shading?: ShadingProperties;
}

export interface StylesConfig {
  readonly heading1: Pick<StyleDefinition, "paragraph" | "run" | "border" | "shading">;
  readonly heading2: Pick<StyleDefinition, "paragraph" | "run" | "border" | "shading">;
  readonly heading3: Pick<StyleDefinition, "paragraph" | "run" | "border" | "shading">;
  readonly heading4: Pick<StyleDefinition, "paragraph" | "run" | "border" | "shading">;
  readonly heading5: Pick<StyleDefinition, "paragraph" | "run" | "border" | "shading">;
  readonly heading6: Pick<StyleDefinition, "paragraph" | "run" | "border" | "shading">;
  readonly paragraph: Pick<StyleDefinition, "paragraph" | "run" | "border" | "shading">;
  readonly blockquote: Pick<StyleDefinition, "paragraph" | "run" | "border" | "shading">;
  readonly inlineCode: Pick<StyleDefinition, "run" | "border" | "shading">;
  readonly codeBlock: Pick<StyleDefinition, "paragraph" | "run" | "border" | "shading">;
  readonly link: Pick<StyleDefinition, "run">;
  readonly table: Pick<StyleDefinition, "table" | "border" | "shading">;
  readonly tableHeader: Pick<StyleDefinition, "paragraph" | "run" | "border" | "shading">;
  readonly tableCell: Pick<StyleDefinition, "paragraph" | "run" | "border" | "shading">;
  readonly orderedList: Pick<StyleDefinition, "paragraph" | "run">;
  readonly unorderedList: Pick<StyleDefinition, "paragraph" | "run">;
  readonly listItem: Pick<StyleDefinition, "paragraph" | "run">;
  readonly image: Pick<StyleDefinition, "image" | "border">;
  readonly thematicBreak: Pick<StyleDefinition, "paragraph" | "border">;
}

export interface NumberingConfig {
  readonly unordered: NumberingPreset;
  readonly ordered: NumberingPreset;
}

export interface NumberingPreset {
  readonly levels: readonly NumberingLevel[];
}

export interface NumberingLevel {
  readonly level: number;
  readonly format: LevelFormat;
  readonly text: string;
  readonly start?: number;
  readonly leftTwip: number;
  readonly hangingTwip: number;
}

export interface HeadersFootersConfig {
  readonly enabled: boolean;
  readonly defaultHeader?: HeaderFooterContent;
  readonly defaultFooter?: HeaderFooterContent;
  readonly firstPageHeader?: HeaderFooterContent;
  readonly firstPageFooter?: HeaderFooterContent;
  readonly evenPageHeader?: HeaderFooterContent;
  readonly evenPageFooter?: HeaderFooterContent;
  readonly pageNumberPlaceholderPolicy: PageNumberPlaceholderPolicy;
}

export type PageNumberPlaceholderPolicy =
  | "disabled"
  | "placeholder"
  | "field";

export interface HeaderFooterContent {
  readonly enabled: boolean;
  readonly blocks: readonly HeaderFooterBlock[];
}

export type HeaderFooterBlock =
  | HeaderFooterTextBlock
  | HeaderFooterPageNumberBlock
  | HeaderFooterTotalPagesBlock;

export interface HeaderFooterTextBlock {
  readonly type: "text";
  readonly value: string;
}

export interface HeaderFooterPageNumberBlock {
  readonly type: "page-number";
}

export interface HeaderFooterTotalPagesBlock {
  readonly type: "total-pages";
}

export interface AdvancedConfig {
  readonly emitBookmarks: boolean;
  readonly emitComments: boolean;
  readonly trackRevisions: boolean;
  readonly ooxmlOverrides: Record<string, never>;
}
