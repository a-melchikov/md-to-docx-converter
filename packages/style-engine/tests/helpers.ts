import type {
  ConversionConfig,
  ParagraphProperties,
  RunProperties
} from "@md-to-docx/config-schema";
import { defaultConfig } from "@md-to-docx/config-schema";
import type {
  BlockNode,
  DocumentNode,
  DocumentPath,
  InlineNode,
  NodeAttributes,
  SourceLocation
} from "@md-to-docx/domain";

export const cloneConfig = (): ConversionConfig =>
  JSON.parse(JSON.stringify(defaultConfig)) as ConversionConfig;

export const path = (index: number): DocumentPath => [
  { type: "root", name: "document" },
  { type: "field", name: "children" },
  { type: "index", index }
];

export const source: SourceLocation = {
  file: "input.md",
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 8, offset: 7 },
  offset: 0,
  length: 7
};

export const document = (children: readonly BlockNode[]): DocumentNode => ({
  kind: "document",
  path: [{ type: "root", name: "document" }],
  children
});

export const paragraph = (
  children: readonly InlineNode[],
  attrs?: NodeAttributes
): BlockNode => ({
  kind: "paragraph",
  path: path(0),
  source,
  ...(attrs === undefined ? {} : { attrs }),
  children
});

export const text = (value: string): InlineNode => ({
  kind: "text",
  value,
  path: [...path(0), { type: "field", name: "children" }, { type: "index", index: 0 }],
  source
});

export const styleAttrs = (style: {
  readonly paragraph?: ParagraphProperties;
  readonly run?: RunProperties;
}): NodeAttributes => ({
  style
});
