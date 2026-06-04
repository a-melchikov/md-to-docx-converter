import type {
  BorderStyle,
  ConversionConfig,
  LevelFormat,
  PageOrientation,
  PageSizePreset,
  ParagraphAlignment,
  RunProperties,
  StyleDefinition
} from "@md-to-docx/config-schema";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type PageMarginSide = "topTwip" | "rightTwip" | "bottomTwip" | "leftTwip";
export type PageSizeDimension = "widthTwip" | "heightTwip";

const TWIP_PER_POINT = 20;
const TWIP_PER_INCH = 1440;
const MILLIMETERS_PER_INCH = 25.4;

export function pointsToHalfPoints(points: number): number {
  return Math.round(points * 2);
}

export function halfPointsToPoints(halfPoints: number | undefined): number {
  return (halfPoints ?? 0) / 2;
}

export function pointsToTwip(points: number): number {
  return Math.round(points * TWIP_PER_POINT);
}

export function twipToPoints(twip: number | undefined): number {
  return roundForInput((twip ?? 0) / TWIP_PER_POINT);
}

export function millimetersToTwip(millimeters: number): number {
  return Math.round((millimeters / MILLIMETERS_PER_INCH) * TWIP_PER_INCH);
}

export function twipToMillimeters(twip: number | undefined): number {
  return roundForInput(((twip ?? 0) / TWIP_PER_INCH) * MILLIMETERS_PER_INCH);
}

export function roundForInput(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeColorInput(value: string): string {
  return value.trim().replace(/^#/, "").toUpperCase();
}

export function updatePageSizePreset(
  config: ConversionConfig,
  preset: PageSizePreset
): ConversionConfig {
  const currentSize = config.document.page.size;
  const customDimensions =
    preset === "custom"
      ? {
          widthTwip: currentSize.widthTwip ?? millimetersToTwip(210),
          heightTwip: currentSize.heightTwip ?? millimetersToTwip(297)
        }
      : {};

  return {
    ...config,
    document: {
      ...config.document,
      page: {
        ...config.document.page,
        size: {
          ...config.document.page.size,
          preset,
          ...customDimensions
        }
      }
    }
  };
}

export function updatePageOrientation(
  config: ConversionConfig,
  orientation: PageOrientation
): ConversionConfig {
  return {
    ...config,
    document: {
      ...config.document,
      page: {
        ...config.document.page,
        size: {
          ...config.document.page.size,
          orientation
        }
      }
    }
  };
}

export function updatePageMarginMillimeters(
  config: ConversionConfig,
  side: PageMarginSide,
  millimeters: number
): ConversionConfig {
  return {
    ...config,
    document: {
      ...config.document,
      page: {
        ...config.document.page,
        margin: {
          ...config.document.page.margin,
          [side]: millimetersToTwip(millimeters)
        }
      }
    }
  };
}

export function updateCustomPageSizeMillimeters(
  config: ConversionConfig,
  dimension: PageSizeDimension,
  millimeters: number
): ConversionConfig {
  return {
    ...config,
    document: {
      ...config.document,
      page: {
        ...config.document.page,
        size: {
          ...config.document.page.size,
          preset: "custom",
          [dimension]: millimetersToTwip(millimeters)
        }
      }
    }
  };
}

export function updateDefaultRun(
  config: ConversionConfig,
  patch: RunProperties
): ConversionConfig {
  return {
    ...config,
    defaults: {
      ...config.defaults,
      run: mergeRunProperties(config.defaults.run, patch)
    }
  };
}

export function updateDefaultParagraphAlignment(
  config: ConversionConfig,
  alignment: ParagraphAlignment
): ConversionConfig {
  return {
    ...config,
    defaults: {
      ...config.defaults,
      paragraph: {
        ...config.defaults.paragraph,
        alignment
      }
    }
  };
}

export function updateDefaultParagraphSpacing(
  config: ConversionConfig,
  key: "beforeTwip" | "afterTwip" | "lineTwip",
  points: number
): ConversionConfig {
  return {
    ...config,
    defaults: {
      ...config.defaults,
      paragraph: {
        ...config.defaults.paragraph,
        spacing: {
          ...config.defaults.paragraph.spacing,
          [key]: pointsToTwip(points)
        }
      }
    }
  };
}

export function updateDefaultFirstLineIndent(
  config: ConversionConfig,
  millimeters: number
): ConversionConfig {
  return {
    ...config,
    defaults: {
      ...config.defaults,
      paragraph: {
        ...config.defaults.paragraph,
        indentation: {
          ...config.defaults.paragraph.indentation,
          firstLineTwip: millimetersToTwip(millimeters)
        }
      }
    }
  };
}

export function updateHeadingStyle(
  config: ConversionConfig,
  level: HeadingLevel,
  patch: StyleDefinition
): ConversionConfig {
  const key = headingKey(level);
  return {
    ...config,
    styles: {
      ...config.styles,
      [key]: mergeStyleDefinition(config.styles[key], patch)
    }
  };
}

export function updateInlineCodeStyle(
  config: ConversionConfig,
  patch: StyleDefinition
): ConversionConfig {
  return updateStyle(config, "inlineCode", patch);
}

export function updateCodeBlockStyle(
  config: ConversionConfig,
  patch: StyleDefinition
): ConversionConfig {
  return updateStyle(config, "codeBlock", patch);
}

export function updateBlockquoteStyle(
  config: ConversionConfig,
  patch: StyleDefinition
): ConversionConfig {
  return updateStyle(config, "blockquote", patch);
}

export function updateDefaultTable(
  config: ConversionConfig,
  patch: ConversionConfig["defaults"]["table"]
): ConversionConfig {
  const nextTable = {
    ...config.defaults.table,
    ...patch,
    ...(patch.border
      ? {
          border: {
            ...config.defaults.table.border,
            ...patch.border
          }
        }
      : {}),
    ...(patch.shading
      ? {
          shading: {
            ...config.defaults.table.shading,
            ...patch.shading
          }
        }
      : {})
  };

  return {
    ...config,
    defaults: {
      ...config.defaults,
      table: nextTable
    }
  };
}

export function updateTableHeaderBold(
  config: ConversionConfig,
  bold: boolean
): ConversionConfig {
  return updateStyle(config, "tableHeader", { run: { bold } });
}

export function setTableWidthAuto(config: ConversionConfig): ConversionConfig {
  const restTable = { ...config.defaults.table };
  delete restTable.widthPct;

  return {
    ...config,
    defaults: {
      ...config.defaults,
      table: restTable
    }
  };
}

export function updateFirstNumberingLevel(
  config: ConversionConfig,
  listType: "ordered" | "unordered",
  patch: Partial<ConversionConfig["numbering"]["ordered"]["levels"][number]>
): ConversionConfig {
  return {
    ...config,
    numbering: {
      ...config.numbering,
      [listType]: {
        ...config.numbering[listType],
        levels: config.numbering[listType].levels.map((level, index) =>
          index === 0 ? { ...level, ...patch } : level
        )
      }
    }
  };
}

export function headingKey(level: HeadingLevel) {
  return `heading${level}` as const;
}

export function borderStyleFromEnabled(enabled: boolean): BorderStyle {
  return enabled ? "single" : "none";
}

export function levelTextForFormat(format: Exclude<LevelFormat, "bullet">) {
  switch (format) {
    case "decimal":
    case "lowerLetter":
    case "upperLetter":
    case "lowerRoman":
    case "upperRoman":
      return "%1.";
  }
}

function updateStyle<K extends keyof ConversionConfig["styles"]>(
  config: ConversionConfig,
  key: K,
  patch: StyleDefinition
): ConversionConfig {
  return {
    ...config,
    styles: {
      ...config.styles,
      [key]: mergeStyleDefinition(config.styles[key], patch)
    }
  };
}

function mergeStyleDefinition<T extends StyleDefinition>(
  base: T,
  patch: StyleDefinition
): T {
  return {
    ...base,
    paragraph: patch.paragraph
      ? {
          ...base.paragraph,
          ...patch.paragraph,
          spacing: patch.paragraph.spacing
            ? {
                ...base.paragraph?.spacing,
                ...patch.paragraph.spacing
              }
            : base.paragraph?.spacing,
          indentation: patch.paragraph.indentation
            ? {
                ...base.paragraph?.indentation,
                ...patch.paragraph.indentation
              }
            : base.paragraph?.indentation
        }
      : base.paragraph,
    run: patch.run ? mergeRunProperties(base.run, patch.run) : base.run,
    table: patch.table
      ? {
          ...base.table,
          ...patch.table,
          border: patch.table.border
            ? {
                ...base.table?.border,
                ...patch.table.border
              }
            : base.table?.border,
          shading: patch.table.shading
            ? {
                ...base.table?.shading,
                ...patch.table.shading
              }
            : base.table?.shading
        }
      : base.table,
    image: patch.image ? { ...base.image, ...patch.image } : base.image,
    border: patch.border
      ? {
          ...base.border,
          ...patch.border
        }
      : base.border,
    shading: patch.shading
      ? {
          ...base.shading,
          ...patch.shading
        }
      : base.shading
  } as T;
}

function mergeRunProperties(
  base: RunProperties | undefined,
  patch: RunProperties
): RunProperties {
  return {
    ...base,
    ...patch,
    ...(patch.font
      ? {
          font: {
            ...base?.font,
            ...patch.font
          }
        }
      : {})
  };
}
