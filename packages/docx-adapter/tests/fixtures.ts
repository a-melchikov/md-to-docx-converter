import type {
  Diagnostic,
  ResolvedBlockNode,
  ResolvedDocument,
  ResolvedInlineNode,
  ResolvedNumberingInfo,
  ResolvedStyleSet
} from "@md-to-docx/domain";
import { halfPoint, pct, twip } from "@md-to-docx/domain";

export const baseStyle: ResolvedStyleSet = {
  paragraph: {
    alignment: "left",
    spacing: { afterTwip: twip(160) },
    indentation: { leftTwip: twip(0), hangingTwip: twip(0) }
  },
  run: {
    font: { ascii: "Times New Roman" },
    sizeHalfPt: halfPoint(24),
    color: "000000"
  }
};

export const codeStyle: ResolvedStyleSet = {
  paragraph: { spacing: { beforeTwip: twip(120), afterTwip: twip(120) } },
  run: {
    font: { ascii: "Courier New" },
    sizeHalfPt: halfPoint(20)
  },
  shading: { fill: "F2F2F2" }
};

export const tableStyle: ResolvedStyleSet = {
  table: {
    widthPct: pct(100),
    cellMarginTwip: twip(120),
    border: { style: "single", color: "000000", sizeTwip: twip(4) }
  }
};

export const imageStyle: ResolvedStyleSet = {
  image: { maxWidthEmu: 914400, preserveAspectRatio: true }
};

export const numbering = (
  kind: "ordered" | "unordered",
  level = 0
): ResolvedNumberingInfo => ({
  kind,
  level,
  levelConfig: {
    level,
    format: kind === "ordered" ? "decimal" : "bullet",
    text: kind === "ordered" ? "%1." : "\u2022",
    start: kind === "ordered" ? 1 : undefined,
    leftTwip: twip(720 * (level + 1)),
    hangingTwip: twip(360)
  }
});

export const textNode = (
  value: string,
  style: ResolvedStyleSet = baseStyle
): ResolvedInlineNode => ({
  kind: "text",
  sourceKind: "text",
  value,
  style
});

export const paragraphNode = (
  children: readonly ResolvedInlineNode[],
  style: ResolvedStyleSet = baseStyle
): ResolvedBlockNode => ({
  kind: "paragraph",
  sourceKind: "paragraph",
  style,
  children
});

export const resolvedDocument = (
  children: readonly ResolvedBlockNode[],
  diagnostics?: readonly Diagnostic[]
): { readonly document: ResolvedDocument; readonly diagnostics?: readonly Diagnostic[] } => ({
  document: {
    kind: "document",
    sourceKind: "document",
    style: {},
    properties: {
      page: {
        size: { preset: "A4", orientation: "portrait" },
        margin: {
          topTwip: twip(1440),
          rightTwip: twip(1440),
          bottomTwip: twip(1440),
          leftTwip: twip(1440)
        }
      },
      columns: { count: 1 },
      metadata: {
        title: "Fixture",
        creator: "tests"
      }
    },
    children
  },
  ...(diagnostics === undefined ? {} : { diagnostics })
});

export const fixtureDocument = (): ResolvedDocument => {
  const link: ResolvedInlineNode = {
    kind: "link",
    sourceKind: "link",
    href: "https://example.com",
    style: {
      ...baseStyle,
      run: { ...baseStyle.run, color: "0563C1", underline: "single" }
    },
    children: [textNode("Example")]
  };
  const image: ResolvedInlineNode = {
    kind: "inline-image",
    sourceKind: "inline-image",
    src: "image.png",
    assetId: "image-1",
    alt: "Fixture image",
    style: imageStyle
  };
  const unorderedItem: ResolvedBlockNode = {
    kind: "list-item",
    sourceKind: "list-item",
    style: baseStyle,
    numbering: numbering("unordered"),
    children: [paragraphNode([textNode("Bullet item")])]
  };
  const nestedItem: ResolvedBlockNode = {
    kind: "list-item",
    sourceKind: "list-item",
    style: baseStyle,
    numbering: numbering("ordered", 1),
    children: [paragraphNode([textNode("Nested item")])]
  };

  return resolvedDocument([
    paragraphNode([textNode("Simple paragraph")]),
    {
      kind: "heading",
      sourceKind: "heading",
      level: 1,
      style: {
        ...baseStyle,
        run: { ...baseStyle.run, bold: true, sizeHalfPt: halfPoint(32) }
      },
      children: [textNode("Heading 1")]
    },
    paragraphNode([
      { kind: "strong", sourceKind: "strong", style: { ...baseStyle, run: { ...baseStyle.run, bold: true } }, children: [textNode("Bold")] },
      { kind: "emphasis", sourceKind: "emphasis", style: { ...baseStyle, run: { ...baseStyle.run, italic: true } }, children: [textNode("Italic")] },
      { kind: "strikethrough", sourceKind: "strikethrough", style: { ...baseStyle, run: { ...baseStyle.run, strike: true } }, children: [textNode("Strike")] },
      { kind: "inline-code", sourceKind: "inline-code", style: codeStyle, value: "inline code" },
      link,
      image
    ]),
    {
      kind: "code-block",
      sourceKind: "code-block",
      style: codeStyle,
      value: "const value = 1;",
      language: "ts"
    },
    {
      kind: "blockquote",
      sourceKind: "blockquote",
      style: {
        ...baseStyle,
        paragraph: { indentation: { leftTwip: twip(720) } },
        border: { style: "single", color: "808080", sizeTwip: twip(4) }
      },
      children: [paragraphNode([textNode("Quote text")])]
    },
    {
      kind: "unordered-list",
      sourceKind: "unordered-list",
      style: baseStyle,
      numbering: numbering("unordered"),
      children: [unorderedItem]
    },
    {
      kind: "ordered-list",
      sourceKind: "ordered-list",
      style: baseStyle,
      start: 1,
      numbering: numbering("ordered"),
      children: [
        {
          kind: "list-item",
          sourceKind: "list-item",
          style: baseStyle,
          numbering: numbering("ordered"),
          children: [
            paragraphNode([textNode("Ordered item")]),
            {
              kind: "ordered-list",
              sourceKind: "ordered-list",
              style: baseStyle,
              numbering: numbering("ordered", 1),
              children: [nestedItem]
            }
          ]
        }
      ]
    },
    {
      kind: "table",
      sourceKind: "table",
      style: tableStyle,
      children: [
        {
          kind: "table-row",
          sourceKind: "table-row",
          style: {},
          children: [
            {
              kind: "table-cell",
              sourceKind: "table-cell",
              isHeader: true,
              style: { ...baseStyle, shading: { fill: "EDEDED" } },
              children: [paragraphNode([textNode("Header cell")])]
            }
          ]
        },
        {
          kind: "table-row",
          sourceKind: "table-row",
          style: {},
          children: [
            {
              kind: "table-cell",
              sourceKind: "table-cell",
              isHeader: false,
              style: baseStyle,
              children: [paragraphNode([textNode("Body cell")])]
            }
          ]
        }
      ]
    },
    {
      kind: "thematic-break",
      sourceKind: "thematic-break",
      style: { border: { style: "single", color: "808080", sizeTwip: twip(4) } }
    }
  ]).document;
};

export const png1x1 = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
]);
