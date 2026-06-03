import type { ConverterConfig } from "./types.js";

const headingStyle = (
  sizeHalfPt: number
): ConverterConfig["styles"]["heading1"] => ({
  paragraph: {
    spacing: { beforeTwip: 240, afterTwip: 120 },
    keepNext: true
  },
  run: {
    font: {
      ascii: "Times New Roman",
      hAnsi: "Times New Roman",
      cs: "Times New Roman"
    },
    sizeHalfPt,
    bold: true
  }
});

const numberingLevels = (
  format: "bullet" | "decimal",
  text: string
): ConverterConfig["numbering"]["unordered"]["levels"] =>
  Array.from({ length: 9 }, (_, index) => ({
    level: index,
    format,
    text,
    ...(format === "decimal" ? { start: 1 } : {}),
    leftTwip: 720 * (index + 1),
    hangingTwip: 360
  }));

export const defaultConfig = {
  version: "1.0.0",
  meta: { name: "Default A4", locale: "ru-RU" },
  input: {
    markdownProfile: "commonmark-gfm",
    enableHtmlSubset: true,
    enableMermaid: false,
    htmlPolicy: "warn-and-skip",
    onUnsupportedNode: "warn-and-skip",
    onInvalidXmlChar: "warn-and-skip"
  },
  document: {
    page: {
      size: { preset: "A4", orientation: "portrait" },
      margin: {
        topTwip: 1440,
        rightTwip: 1440,
        bottomTwip: 1440,
        leftTwip: 1440
      }
    },
    columns: { count: 1, spacingTwip: 720 },
    metadata: {
      title: "Markdown document",
      creator: "md-to-docx-converter",
      language: "ru-RU"
    }
  },
  defaults: {
    paragraph: {
      alignment: "left",
      spacing: {
        beforeTwip: 0,
        afterTwip: 160,
        lineTwip: 276,
        lineRule: "auto"
      },
      indentation: {
        leftTwip: 0,
        rightTwip: 0,
        firstLineTwip: 0,
        hangingTwip: 0
      },
      widowControl: true
    },
    run: {
      font: {
        ascii: "Times New Roman",
        hAnsi: "Times New Roman",
        cs: "Times New Roman",
        eastAsia: "Times New Roman"
      },
      sizeHalfPt: 24,
      color: "000000"
    },
    table: {
      widthPct: 100,
      cellMarginTwip: 120,
      border: { style: "single", color: "000000", sizeTwip: 4 }
    },
    image: {
      maxWidthEmu: 5486400,
      preserveAspectRatio: true
    }
  },
  styles: {
    heading1: headingStyle(32),
    heading2: headingStyle(28),
    heading3: headingStyle(26),
    heading4: headingStyle(24),
    heading5: headingStyle(22),
    heading6: headingStyle(20),
    paragraph: { paragraph: {}, run: {} },
    blockquote: {
      paragraph: {
        indentation: { leftTwip: 720 },
        spacing: { beforeTwip: 120, afterTwip: 120 }
      },
      border: { style: "single", color: "808080", sizeTwip: 4 }
    },
    inlineCode: {
      run: {
        font: {
          ascii: "Courier New",
          hAnsi: "Courier New",
          cs: "Courier New"
        },
        sizeHalfPt: 22
      },
      shading: { fill: "F2F2F2" }
    },
    codeBlock: {
      paragraph: {
        spacing: {
          beforeTwip: 120,
          afterTwip: 120,
          lineTwip: 240,
          lineRule: "exact"
        }
      },
      run: {
        font: {
          ascii: "Courier New",
          hAnsi: "Courier New",
          cs: "Courier New"
        },
        sizeHalfPt: 20
      },
      shading: { fill: "F7F7F7" }
    },
    link: { run: { color: "0563C1", underline: "single" } },
    table: { table: { widthPct: 100, cellMarginTwip: 120 } },
    tableHeader: { run: { bold: true }, shading: { fill: "EDEDED" } },
    tableCell: { paragraph: { spacing: { beforeTwip: 0, afterTwip: 0 } } },
    orderedList: { paragraph: {} },
    unorderedList: { paragraph: {} },
    listItem: { paragraph: {} },
    image: { image: { maxWidthEmu: 5486400, preserveAspectRatio: true } },
    thematicBreak: {
      border: { style: "single", color: "808080", sizeTwip: 4 }
    }
  },
  numbering: {
    unordered: { levels: numberingLevels("bullet", "\u2022") },
    ordered: { levels: numberingLevels("decimal", "%1.") }
  },
  headersFooters: {
    enabled: false,
    defaultHeader: { enabled: false, blocks: [] },
    defaultFooter: { enabled: false, blocks: [] },
    pageNumberPlaceholderPolicy: "disabled"
  },
  advanced: {
    emitBookmarks: false,
    emitComments: false,
    trackRevisions: false,
    ooxmlOverrides: {}
  }
} satisfies ConverterConfig;
