import type {
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
    spacing: { beforeTwip: twip(0), afterTwip: twip(160), lineTwip: twip(276) },
    indentation: { leftTwip: twip(0), rightTwip: twip(0) }
  },
  run: {
    font: { ascii: "Times New Roman" },
    sizeHalfPt: halfPoint(24),
    color: "000000"
  }
};

export const codeStyle: ResolvedStyleSet = {
  paragraph: {
    spacing: { beforeTwip: twip(120), afterTwip: twip(120), lineTwip: twip(240) }
  },
  run: {
    font: { ascii: "Courier New" },
    sizeHalfPt: halfPoint(20)
  },
  shading: { fill: "F7F7F7" }
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

export const textNode = (
  value: string,
  style: ResolvedStyleSet = baseStyle
): ResolvedInlineNode => ({
  kind: "text",
  sourceKind: "text",
  style,
  value
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
    leftTwip: twip(720 * (level + 1)),
    hangingTwip: twip(360)
  }
});

export const resolvedDocument = (
  children: readonly ResolvedBlockNode[]
): ResolvedDocument => ({
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
    metadata: {}
  },
  children
});

export const fixtureDocument = (): ResolvedDocument => {
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
      {
        kind: "link",
        sourceKind: "link",
        href: "https://example.com",
        style: { ...baseStyle, run: { ...baseStyle.run, underline: "single" } },
        children: [textNode("Safe link")]
      },
      {
        kind: "inline-image",
        sourceKind: "inline-image",
        src: "https://example.com/image.png",
        alt: "Inline image",
        style: imageStyle
      }
    ]),
    {
      kind: "code-block",
      sourceKind: "code-block",
      style: codeStyle,
      value: "const value = 1;"
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
      kind: "image-block",
      sourceKind: "image-block",
      src: "https://example.com/block.png",
      alt: "Block image",
      style: imageStyle
    },
    {
      kind: "thematic-break",
      sourceKind: "thematic-break",
      style: { border: { style: "single", color: "808080", sizeTwip: twip(4) } }
    }
  ]);
};
