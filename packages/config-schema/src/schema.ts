export const converterConfigSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://md-to-docx-converter.local/schemas/converter-config.schema.json",
  title: "Markdown to DOCX converter configuration",
  type: "object",
  additionalProperties: false,
  required: [
    "version",
    "input",
    "document",
    "defaults",
    "styles",
    "numbering",
    "headersFooters",
    "advanced"
  ],
  properties: {
    version: { $ref: "#/$defs/semver" },
    meta: { $ref: "#/$defs/meta" },
    input: { $ref: "#/$defs/input" },
    document: { $ref: "#/$defs/document" },
    defaults: { $ref: "#/$defs/defaults" },
    styles: { $ref: "#/$defs/styles" },
    numbering: { $ref: "#/$defs/numbering" },
    headersFooters: { $ref: "#/$defs/headersFooters" },
    advanced: { $ref: "#/$defs/advanced" }
  },
  $defs: {
    semver: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
    nonNegativeNumber: { type: "number", minimum: 0 },
    positiveInteger: { type: "integer", minimum: 1 },
    pct: { type: "number", minimum: 0, maximum: 100 },
    hexColor: { type: "string", pattern: "^[0-9A-Fa-f]{6}$" },
    meta: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        locale: { type: "string" },
        author: { type: "string" },
        createdAt: { type: "string" },
        updatedAt: { type: "string" }
      }
    },
    input: {
      type: "object",
      additionalProperties: false,
      required: [
        "markdownProfile",
        "enableHtmlSubset",
        "enableMermaid",
        "htmlPolicy",
        "onUnsupportedNode",
        "onInvalidXmlChar"
      ],
      properties: {
        markdownProfile: { enum: ["commonmark", "commonmark-gfm"] },
        enableHtmlSubset: { type: "boolean" },
        enableMermaid: { type: "boolean" },
        htmlPolicy: { enum: ["warn-and-skip", "error", "fallback-text"] },
        onUnsupportedNode: {
          enum: ["warn-and-skip", "error", "fallback-text"]
        },
        onInvalidXmlChar: {
          enum: ["warn-and-skip", "error", "replace-uFFFD"]
        }
      }
    },
    document: {
      type: "object",
      additionalProperties: false,
      required: ["page", "columns", "metadata"],
      properties: {
        page: { $ref: "#/$defs/page" },
        columns: { $ref: "#/$defs/columns" },
        metadata: { $ref: "#/$defs/documentMetadata" }
      }
    },
    page: {
      type: "object",
      additionalProperties: false,
      required: ["size", "margin"],
      properties: {
        size: { $ref: "#/$defs/pageSize" },
        margin: { $ref: "#/$defs/pageMargin" }
      }
    },
    pageSize: {
      type: "object",
      additionalProperties: false,
      required: ["preset", "orientation"],
      properties: {
        preset: { enum: ["A4", "A3", "Letter", "Legal", "custom"] },
        orientation: { enum: ["portrait", "landscape"] },
        widthTwip: { $ref: "#/$defs/nonNegativeNumber" },
        heightTwip: { $ref: "#/$defs/nonNegativeNumber" }
      }
    },
    pageMargin: {
      type: "object",
      additionalProperties: false,
      required: ["topTwip", "rightTwip", "bottomTwip", "leftTwip"],
      properties: {
        topTwip: { $ref: "#/$defs/nonNegativeNumber" },
        rightTwip: { $ref: "#/$defs/nonNegativeNumber" },
        bottomTwip: { $ref: "#/$defs/nonNegativeNumber" },
        leftTwip: { $ref: "#/$defs/nonNegativeNumber" }
      }
    },
    columns: {
      type: "object",
      additionalProperties: false,
      required: ["count"],
      properties: {
        count: { type: "integer", minimum: 1, maximum: 12 },
        spacingTwip: { $ref: "#/$defs/nonNegativeNumber" }
      }
    },
    documentMetadata: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        subject: { type: "string" },
        creator: { type: "string" },
        keywords: { type: "array", items: { type: "string" } },
        category: { type: "string" },
        description: { type: "string" },
        language: { type: "string" }
      }
    },
    defaults: {
      type: "object",
      additionalProperties: false,
      required: ["paragraph", "run", "table", "image"],
      properties: {
        paragraph: { $ref: "#/$defs/paragraphProperties" },
        run: { $ref: "#/$defs/runProperties" },
        table: { $ref: "#/$defs/tableProperties" },
        image: { $ref: "#/$defs/imageProperties" }
      }
    },
    paragraphProperties: {
      type: "object",
      additionalProperties: false,
      properties: {
        alignment: { enum: ["left", "center", "right", "both", "justify"] },
        spacing: { $ref: "#/$defs/paragraphSpacing" },
        indentation: { $ref: "#/$defs/paragraphIndentation" },
        keepNext: { type: "boolean" },
        keepLines: { type: "boolean" },
        widowControl: { type: "boolean" },
        pageBreakBefore: { type: "boolean" }
      }
    },
    paragraphSpacing: {
      type: "object",
      additionalProperties: false,
      properties: {
        beforeTwip: { $ref: "#/$defs/nonNegativeNumber" },
        afterTwip: { $ref: "#/$defs/nonNegativeNumber" },
        lineTwip: { $ref: "#/$defs/nonNegativeNumber" },
        lineRule: { enum: ["auto", "exact", "atLeast"] }
      }
    },
    paragraphIndentation: {
      type: "object",
      additionalProperties: false,
      properties: {
        leftTwip: { $ref: "#/$defs/nonNegativeNumber" },
        rightTwip: { $ref: "#/$defs/nonNegativeNumber" },
        firstLineTwip: { $ref: "#/$defs/nonNegativeNumber" },
        hangingTwip: { $ref: "#/$defs/nonNegativeNumber" }
      }
    },
    runProperties: {
      type: "object",
      additionalProperties: false,
      properties: {
        font: { $ref: "#/$defs/fontProperties" },
        sizeHalfPt: { $ref: "#/$defs/nonNegativeNumber" },
        bold: { type: "boolean" },
        italic: { type: "boolean" },
        underline: { enum: ["none", "single", "double"] },
        strike: { type: "boolean" },
        color: { $ref: "#/$defs/hexColor" },
        highlight: { $ref: "#/$defs/hexColor" },
        smallCaps: { type: "boolean" },
        allCaps: { type: "boolean" },
        superscript: { type: "boolean" },
        subscript: { type: "boolean" }
      },
      not: {
        required: ["superscript", "subscript"],
        properties: {
          superscript: { const: true },
          subscript: { const: true }
        }
      }
    },
    fontProperties: {
      type: "object",
      additionalProperties: false,
      properties: {
        ascii: { type: "string" },
        hAnsi: { type: "string" },
        cs: { type: "string" },
        eastAsia: { type: "string" }
      }
    },
    tableProperties: {
      type: "object",
      additionalProperties: false,
      properties: {
        widthPct: { $ref: "#/$defs/pct" },
        cellMarginTwip: { $ref: "#/$defs/nonNegativeNumber" },
        border: { $ref: "#/$defs/borderProperties" },
        shading: { $ref: "#/$defs/shadingProperties" }
      }
    },
    imageProperties: {
      type: "object",
      additionalProperties: false,
      properties: {
        maxWidthEmu: { $ref: "#/$defs/nonNegativeNumber" },
        maxHeightEmu: { $ref: "#/$defs/nonNegativeNumber" },
        preserveAspectRatio: { type: "boolean" }
      }
    },
    borderProperties: {
      type: "object",
      additionalProperties: false,
      properties: {
        style: { enum: ["none", "single", "double", "dashed", "dotted"] },
        color: { $ref: "#/$defs/hexColor" },
        sizeTwip: { $ref: "#/$defs/nonNegativeNumber" }
      }
    },
    shadingProperties: {
      type: "object",
      additionalProperties: false,
      properties: { fill: { $ref: "#/$defs/hexColor" } }
    },
    styles: {
      type: "object",
      additionalProperties: false,
      required: [
        "heading1",
        "heading2",
        "heading3",
        "heading4",
        "heading5",
        "heading6",
        "paragraph",
        "blockquote",
        "inlineCode",
        "codeBlock",
        "link",
        "table",
        "tableHeader",
        "tableCell",
        "orderedList",
        "unorderedList",
        "listItem",
        "image",
        "thematicBreak"
      ],
      properties: {
        heading1: { $ref: "#/$defs/blockStyle" },
        heading2: { $ref: "#/$defs/blockStyle" },
        heading3: { $ref: "#/$defs/blockStyle" },
        heading4: { $ref: "#/$defs/blockStyle" },
        heading5: { $ref: "#/$defs/blockStyle" },
        heading6: { $ref: "#/$defs/blockStyle" },
        paragraph: { $ref: "#/$defs/blockStyle" },
        blockquote: { $ref: "#/$defs/blockStyle" },
        inlineCode: { $ref: "#/$defs/inlineStyle" },
        codeBlock: { $ref: "#/$defs/blockStyle" },
        link: { $ref: "#/$defs/linkStyle" },
        table: { $ref: "#/$defs/tableStyle" },
        tableHeader: { $ref: "#/$defs/tableCellStyle" },
        tableCell: { $ref: "#/$defs/tableCellStyle" },
        orderedList: { $ref: "#/$defs/listStyle" },
        unorderedList: { $ref: "#/$defs/listStyle" },
        listItem: { $ref: "#/$defs/listStyle" },
        image: { $ref: "#/$defs/imageStyle" },
        thematicBreak: { $ref: "#/$defs/thematicBreakStyle" }
      }
    },
    blockStyle: {
      type: "object",
      additionalProperties: false,
      properties: {
        paragraph: { $ref: "#/$defs/paragraphProperties" },
        run: { $ref: "#/$defs/runProperties" },
        border: { $ref: "#/$defs/borderProperties" },
        shading: { $ref: "#/$defs/shadingProperties" }
      }
    },
    inlineStyle: {
      type: "object",
      additionalProperties: false,
      properties: {
        run: { $ref: "#/$defs/runProperties" },
        border: { $ref: "#/$defs/borderProperties" },
        shading: { $ref: "#/$defs/shadingProperties" }
      }
    },
    linkStyle: {
      type: "object",
      additionalProperties: false,
      properties: { run: { $ref: "#/$defs/runProperties" } }
    },
    tableStyle: {
      type: "object",
      additionalProperties: false,
      properties: {
        table: { $ref: "#/$defs/tableProperties" },
        border: { $ref: "#/$defs/borderProperties" },
        shading: { $ref: "#/$defs/shadingProperties" }
      }
    },
    tableCellStyle: {
      type: "object",
      additionalProperties: false,
      properties: {
        paragraph: { $ref: "#/$defs/paragraphProperties" },
        run: { $ref: "#/$defs/runProperties" },
        border: { $ref: "#/$defs/borderProperties" },
        shading: { $ref: "#/$defs/shadingProperties" }
      }
    },
    listStyle: {
      type: "object",
      additionalProperties: false,
      properties: {
        paragraph: { $ref: "#/$defs/paragraphProperties" },
        run: { $ref: "#/$defs/runProperties" }
      }
    },
    imageStyle: {
      type: "object",
      additionalProperties: false,
      properties: {
        image: { $ref: "#/$defs/imageProperties" },
        border: { $ref: "#/$defs/borderProperties" }
      }
    },
    thematicBreakStyle: {
      type: "object",
      additionalProperties: false,
      properties: {
        paragraph: { $ref: "#/$defs/paragraphProperties" },
        border: { $ref: "#/$defs/borderProperties" }
      }
    },
    numbering: {
      type: "object",
      additionalProperties: false,
      required: ["unordered", "ordered"],
      properties: {
        unordered: { $ref: "#/$defs/numberingPreset" },
        ordered: { $ref: "#/$defs/numberingPreset" }
      }
    },
    numberingPreset: {
      type: "object",
      additionalProperties: false,
      required: ["levels"],
      properties: {
        levels: {
          type: "array",
          minItems: 1,
          maxItems: 9,
          items: { $ref: "#/$defs/numberingLevel" }
        }
      }
    },
    numberingLevel: {
      type: "object",
      additionalProperties: false,
      required: ["level", "format", "text", "leftTwip", "hangingTwip"],
      properties: {
        level: { type: "integer", minimum: 0, maximum: 8 },
        format: {
          enum: [
            "bullet",
            "decimal",
            "lowerLetter",
            "upperLetter",
            "lowerRoman",
            "upperRoman"
          ]
        },
        text: { type: "string" },
        start: { $ref: "#/$defs/positiveInteger" },
        leftTwip: { $ref: "#/$defs/nonNegativeNumber" },
        hangingTwip: { $ref: "#/$defs/nonNegativeNumber" }
      }
    },
    headersFooters: {
      type: "object",
      additionalProperties: false,
      required: ["enabled", "pageNumberPlaceholderPolicy"],
      properties: {
        enabled: { type: "boolean" },
        defaultHeader: { $ref: "#/$defs/headerFooterContent" },
        defaultFooter: { $ref: "#/$defs/headerFooterContent" },
        firstPageHeader: { $ref: "#/$defs/headerFooterContent" },
        firstPageFooter: { $ref: "#/$defs/headerFooterContent" },
        evenPageHeader: { $ref: "#/$defs/headerFooterContent" },
        evenPageFooter: { $ref: "#/$defs/headerFooterContent" },
        pageNumberPlaceholderPolicy: {
          enum: ["disabled", "placeholder", "field"]
        }
      }
    },
    headerFooterContent: {
      type: "object",
      additionalProperties: false,
      required: ["enabled", "blocks"],
      properties: {
        enabled: { type: "boolean" },
        blocks: {
          type: "array",
          items: { $ref: "#/$defs/headerFooterBlock" }
        }
      }
    },
    headerFooterBlock: {
      oneOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["type", "value"],
          properties: {
            type: { const: "text" },
            value: { type: "string" }
          }
        },
        {
          type: "object",
          additionalProperties: false,
          required: ["type"],
          properties: { type: { const: "page-number" } }
        },
        {
          type: "object",
          additionalProperties: false,
          required: ["type"],
          properties: { type: { const: "total-pages" } }
        }
      ]
    },
    advanced: {
      type: "object",
      additionalProperties: false,
      required: [
        "emitBookmarks",
        "emitComments",
        "trackRevisions",
        "ooxmlOverrides"
      ],
      properties: {
        emitBookmarks: { type: "boolean" },
        emitComments: { type: "boolean" },
        trackRevisions: { type: "boolean" },
        ooxmlOverrides: { type: "object", additionalProperties: false }
      }
    }
  }
} as const;
