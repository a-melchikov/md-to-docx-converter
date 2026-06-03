import type {
  BorderProperties,
  BorderStyle,
  DefaultsConfig,
  FontProperties,
  ImageProperties,
  LineRule,
  ParagraphAlignment,
  ParagraphIndentation,
  ParagraphProperties,
  ParagraphSpacing,
  RunProperties,
  ShadingProperties,
  StyleDefinition,
  TableProperties,
  UnderlineStyle
} from "@md-to-docx/config-schema";
import type {
  Diagnostic,
  DocumentPath,
  NodeAttributes,
  ResolvedBorderProperties,
  ResolvedImageProperties,
  ResolvedParagraphIndentation,
  ResolvedParagraphProperties,
  ResolvedParagraphSpacing,
  ResolvedRunProperties,
  ResolvedShadingProperties,
  ResolvedStyleSet,
  ResolvedTableProperties,
  SourceLocation
} from "@md-to-docx/domain";
import { emu, halfPoint, pct, twip } from "@md-to-docx/domain";

import {
  createStyleDiagnostic,
  unitConversionErrorMessage
} from "./diagnostics.js";

export interface ResolveCascadeInput {
  readonly defaults: DefaultsConfig;
  readonly namedStyle?: StyleDefinition | undefined;
  readonly markdownStyle?: StyleDefinition | undefined;
  readonly directStyle?: StyleDefinition | undefined;
  readonly path?: DocumentPath | undefined;
  readonly source?: SourceLocation | undefined;
  readonly diagnostics: Diagnostic[];
  readonly includeDefaults?: boolean | undefined;
}

interface NormalizeContext {
  readonly path?: DocumentPath | undefined;
  readonly source?: SourceLocation | undefined;
  readonly diagnostics: Diagnostic[];
}

export const resolveStyleCascade = (
  input: ResolveCascadeInput
): ResolvedStyleSet => {
  const context: NormalizeContext = {
    path: input.path,
    source: input.source,
    diagnostics: input.diagnostics
  };
  const defaults =
    input.includeDefaults === false ? {} : normalizeDefaults(input.defaults, context);
  const named = normalizeStyleDefinition(input.namedStyle, context);
  const markdown = normalizeStyleDefinition(input.markdownStyle, context);
  const direct = normalizeStyleDefinition(input.directStyle, context);

  return mergeStyleSets(defaults, named, markdown, direct);
};

export const directStyleFromAttrs = (
  attrs: NodeAttributes | undefined
): StyleDefinition | undefined => {
  const style = attrs?.style;

  if (!isRecord(style)) {
    return undefined;
  }

  const paragraph = coerceParagraphProperties(style.paragraph);
  const run = coerceRunProperties(style.run);
  const table = coerceTableProperties(style.table);
  const image = coerceImageProperties(style.image);
  const border = coerceBorderProperties(style.border);
  const shading = coerceShadingProperties(style.shading);

  return {
    ...(paragraph === undefined ? {} : { paragraph }),
    ...(run === undefined ? {} : { run }),
    ...(table === undefined ? {} : { table }),
    ...(image === undefined ? {} : { image }),
    ...(border === undefined ? {} : { border }),
    ...(shading === undefined ? {} : { shading })
  };
};

const normalizeDefaults = (
  defaults: DefaultsConfig,
  context: NormalizeContext
): ResolvedStyleSet => ({
  paragraph: normalizeParagraphProperties(defaults.paragraph, context),
  run: normalizeRunProperties(defaults.run, context),
  table: normalizeTableProperties(defaults.table, context),
  image: normalizeImageProperties(defaults.image, context)
});

const normalizeStyleDefinition = (
  style: StyleDefinition | undefined,
  context: NormalizeContext
): ResolvedStyleSet => {
  if (style === undefined) {
    return {};
  }

  return {
    ...(style.paragraph === undefined
      ? {}
      : { paragraph: normalizeParagraphProperties(style.paragraph, context) }),
    ...(style.run === undefined
      ? {}
      : { run: normalizeRunProperties(style.run, context) }),
    ...(style.table === undefined
      ? {}
      : { table: normalizeTableProperties(style.table, context) }),
    ...(style.image === undefined
      ? {}
      : { image: normalizeImageProperties(style.image, context) }),
    ...(style.border === undefined
      ? {}
      : { border: normalizeBorderProperties(style.border, context) }),
    ...(style.shading === undefined
      ? {}
      : { shading: normalizeShadingProperties(style.shading) })
  };
};

export const mergeStyleSets = (
  ...sets: readonly ResolvedStyleSet[]
): ResolvedStyleSet =>
  sets.reduce<ResolvedStyleSet>(
    (merged, current) => ({
      paragraph: mergeParagraphProperties(merged.paragraph, current.paragraph),
      run: mergeRunProperties(merged.run, current.run),
      table: mergeTableProperties(merged.table, current.table),
      image: mergeImageProperties(merged.image, current.image),
      border: mergeBorderProperties(merged.border, current.border),
      shading: mergeShadingProperties(merged.shading, current.shading)
    }),
    {}
  );

const normalizeParagraphProperties = (
  properties: ParagraphProperties,
  context: NormalizeContext
): ResolvedParagraphProperties => ({
  ...(properties.alignment === undefined
    ? {}
    : { alignment: properties.alignment }),
  ...(properties.spacing === undefined
    ? {}
    : { spacing: normalizeParagraphSpacing(properties.spacing, context) }),
  ...(properties.indentation === undefined
    ? {}
    : {
        indentation: normalizeParagraphIndentation(
          properties.indentation,
          context
        )
      }),
  ...(properties.keepNext === undefined ? {} : { keepNext: properties.keepNext }),
  ...(properties.keepLines === undefined ? {} : { keepLines: properties.keepLines }),
  ...(properties.widowControl === undefined
    ? {}
    : { widowControl: properties.widowControl }),
  ...(properties.pageBreakBefore === undefined
    ? {}
    : { pageBreakBefore: properties.pageBreakBefore })
});

const normalizeParagraphSpacing = (
  spacing: ParagraphSpacing,
  context: NormalizeContext
): ResolvedParagraphSpacing => ({
  ...(spacing.beforeTwip === undefined
    ? {}
    : {
        beforeTwip: convertUnit(
          spacing.beforeTwip,
          "paragraph.spacing.beforeTwip",
          "Twip",
          twip,
          context
        )
      }),
  ...(spacing.afterTwip === undefined
    ? {}
    : {
        afterTwip: convertUnit(
          spacing.afterTwip,
          "paragraph.spacing.afterTwip",
          "Twip",
          twip,
          context
        )
      }),
  ...(spacing.lineTwip === undefined
    ? {}
    : {
        lineTwip: convertUnit(
          spacing.lineTwip,
          "paragraph.spacing.lineTwip",
          "Twip",
          twip,
          context
        )
      }),
  ...(spacing.lineRule === undefined ? {} : { lineRule: spacing.lineRule })
});

const normalizeParagraphIndentation = (
  indentation: ParagraphIndentation,
  context: NormalizeContext
): ResolvedParagraphIndentation => ({
  ...(indentation.leftTwip === undefined
    ? {}
    : {
        leftTwip: convertUnit(
          indentation.leftTwip,
          "paragraph.indentation.leftTwip",
          "Twip",
          twip,
          context
        )
      }),
  ...(indentation.rightTwip === undefined
    ? {}
    : {
        rightTwip: convertUnit(
          indentation.rightTwip,
          "paragraph.indentation.rightTwip",
          "Twip",
          twip,
          context
        )
      }),
  ...(indentation.firstLineTwip === undefined
    ? {}
    : {
        firstLineTwip: convertUnit(
          indentation.firstLineTwip,
          "paragraph.indentation.firstLineTwip",
          "Twip",
          twip,
          context
        )
      }),
  ...(indentation.hangingTwip === undefined
    ? {}
    : {
        hangingTwip: convertUnit(
          indentation.hangingTwip,
          "paragraph.indentation.hangingTwip",
          "Twip",
          twip,
          context
        )
      })
});

const normalizeRunProperties = (
  properties: RunProperties,
  context: NormalizeContext
): ResolvedRunProperties => ({
  ...(properties.font === undefined ? {} : { font: normalizeFont(properties.font) }),
  ...(properties.sizeHalfPt === undefined
    ? {}
    : {
        sizeHalfPt: convertUnit(
          properties.sizeHalfPt,
          "run.sizeHalfPt",
          "HalfPoint",
          halfPoint,
          context
        )
      }),
  ...(properties.bold === undefined ? {} : { bold: properties.bold }),
  ...(properties.italic === undefined ? {} : { italic: properties.italic }),
  ...(properties.underline === undefined ? {} : { underline: properties.underline }),
  ...(properties.strike === undefined ? {} : { strike: properties.strike }),
  ...(properties.color === undefined ? {} : { color: properties.color }),
  ...(properties.highlight === undefined ? {} : { highlight: properties.highlight }),
  ...(properties.smallCaps === undefined ? {} : { smallCaps: properties.smallCaps }),
  ...(properties.allCaps === undefined ? {} : { allCaps: properties.allCaps }),
  ...(properties.superscript === undefined
    ? {}
    : { superscript: properties.superscript }),
  ...(properties.subscript === undefined ? {} : { subscript: properties.subscript })
});

const normalizeFont = (font: FontProperties): ResolvedRunProperties["font"] => ({
  ...(font.ascii === undefined ? {} : { ascii: font.ascii }),
  ...(font.hAnsi === undefined ? {} : { hAnsi: font.hAnsi }),
  ...(font.cs === undefined ? {} : { cs: font.cs }),
  ...(font.eastAsia === undefined ? {} : { eastAsia: font.eastAsia })
});

const normalizeTableProperties = (
  properties: TableProperties,
  context: NormalizeContext
): ResolvedTableProperties => ({
  ...(properties.widthPct === undefined
    ? {}
    : {
        widthPct: convertUnit(
          properties.widthPct,
          "table.widthPct",
          "Pct",
          pct,
          context
        )
      }),
  ...(properties.cellMarginTwip === undefined
    ? {}
    : {
        cellMarginTwip: convertUnit(
          properties.cellMarginTwip,
          "table.cellMarginTwip",
          "Twip",
          twip,
          context
        )
      }),
  ...(properties.border === undefined
    ? {}
    : { border: normalizeBorderProperties(properties.border, context) }),
  ...(properties.shading === undefined
    ? {}
    : { shading: normalizeShadingProperties(properties.shading) })
});

const normalizeImageProperties = (
  properties: ImageProperties,
  context: NormalizeContext
): ResolvedImageProperties => ({
  ...(properties.maxWidthEmu === undefined
    ? {}
    : {
        maxWidthEmu: convertUnit(
          properties.maxWidthEmu,
          "image.maxWidthEmu",
          "Emu",
          emu,
          context
        )
      }),
  ...(properties.maxHeightEmu === undefined
    ? {}
    : {
        maxHeightEmu: convertUnit(
          properties.maxHeightEmu,
          "image.maxHeightEmu",
          "Emu",
          emu,
          context
        )
      }),
  ...(properties.preserveAspectRatio === undefined
    ? {}
    : { preserveAspectRatio: properties.preserveAspectRatio })
});

const normalizeBorderProperties = (
  properties: BorderProperties,
  context: NormalizeContext
): ResolvedBorderProperties => ({
  ...(properties.style === undefined ? {} : { style: properties.style }),
  ...(properties.color === undefined ? {} : { color: properties.color }),
  ...(properties.sizeTwip === undefined
    ? {}
    : {
        sizeTwip: convertUnit(
          properties.sizeTwip,
          "border.sizeTwip",
          "Twip",
          twip,
          context
        )
      })
});

const normalizeShadingProperties = (
  properties: ShadingProperties
): ResolvedShadingProperties => ({
  ...(properties.fill === undefined ? {} : { fill: properties.fill })
});

const mergeParagraphProperties = (
  base: ResolvedParagraphProperties | undefined,
  override: ResolvedParagraphProperties | undefined
): ResolvedParagraphProperties | undefined => {
  if (base === undefined) {
    return override;
  }

  if (override === undefined) {
    return base;
  }
  const merged = mergeDefined(base, override) ?? {};
  const spacing = mergeDefined(base.spacing, override.spacing);
  const indentation = mergeDefined(base.indentation, override.indentation);

  return {
    ...merged,
    ...(spacing === undefined ? {} : { spacing }),
    ...(indentation === undefined ? {} : { indentation })
  };
};

const mergeRunProperties = (
  base: ResolvedRunProperties | undefined,
  override: ResolvedRunProperties | undefined
): ResolvedRunProperties | undefined => {
  if (base === undefined) {
    return override;
  }

  if (override === undefined) {
    return base;
  }
  const merged = mergeDefined(base, override) ?? {};
  const font = mergeDefined(base.font, override.font);

  return {
    ...merged,
    ...(font === undefined ? {} : { font })
  };
};

const mergeTableProperties = (
  base: ResolvedTableProperties | undefined,
  override: ResolvedTableProperties | undefined
): ResolvedTableProperties | undefined => {
  if (base === undefined) {
    return override;
  }

  if (override === undefined) {
    return base;
  }
  const merged = mergeDefined(base, override) ?? {};
  const border = mergeBorderProperties(base.border, override.border);
  const shading = mergeShadingProperties(base.shading, override.shading);

  return {
    ...merged,
    ...(border === undefined ? {} : { border }),
    ...(shading === undefined ? {} : { shading })
  };
};

const mergeImageProperties = (
  base: ResolvedImageProperties | undefined,
  override: ResolvedImageProperties | undefined
): ResolvedImageProperties | undefined => mergeDefined(base, override);

const mergeBorderProperties = (
  base: ResolvedBorderProperties | undefined,
  override: ResolvedBorderProperties | undefined
): ResolvedBorderProperties | undefined => mergeDefined(base, override);

const mergeShadingProperties = (
  base: ResolvedShadingProperties | undefined,
  override: ResolvedShadingProperties | undefined
): ResolvedShadingProperties | undefined => mergeDefined(base, override);

const mergeDefined = <T extends object>(
  base: T | undefined,
  override: T | undefined
): T | undefined => {
  if (base === undefined) {
    return override;
  }

  if (override === undefined) {
    return base;
  }

  const merged: Record<string, unknown> = {
    ...(base as unknown as Record<string, unknown>)
  };

  for (const [key, value] of Object.entries(
    override as unknown as Record<string, unknown>
  )) {
    if (value !== undefined) {
      merged[key] = value;
    }
  }

  return merged as T;
};

const convertUnit = <TUnit>(
  value: number,
  field: string,
  unit: string,
  factory: (value: number) => TUnit,
  context: NormalizeContext
): TUnit | undefined => {
  try {
    return factory(value);
  } catch (error) {
    context.diagnostics.push(
      createStyleDiagnostic({
        severity: "warning",
        code: "style.unitConversionError",
        message: unitConversionErrorMessage(field, unit),
        source: context.source,
        path: context.path,
        metadata: {
          field,
          unit,
          value,
          error:
            error instanceof Error ? error.message : "Unknown unit conversion error"
        }
      })
    );

    return undefined;
  }
};

const coerceParagraphProperties = (
  value: unknown
): ParagraphProperties | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    ...(isParagraphAlignment(value.alignment)
      ? { alignment: value.alignment }
      : {}),
    ...(isRecord(value.spacing)
      ? { spacing: coerceParagraphSpacing(value.spacing) }
      : {}),
    ...(isRecord(value.indentation)
      ? { indentation: coerceParagraphIndentation(value.indentation) }
      : {}),
    ...(isBoolean(value.keepNext) ? { keepNext: value.keepNext } : {}),
    ...(isBoolean(value.keepLines) ? { keepLines: value.keepLines } : {}),
    ...(isBoolean(value.widowControl) ? { widowControl: value.widowControl } : {}),
    ...(isBoolean(value.pageBreakBefore)
      ? { pageBreakBefore: value.pageBreakBefore }
      : {})
  };
};

const coerceParagraphSpacing = (
  value: Record<string, unknown>
): ParagraphSpacing => ({
  ...(isNumber(value.beforeTwip) ? { beforeTwip: value.beforeTwip } : {}),
  ...(isNumber(value.afterTwip) ? { afterTwip: value.afterTwip } : {}),
  ...(isNumber(value.lineTwip) ? { lineTwip: value.lineTwip } : {}),
  ...(isLineRule(value.lineRule) ? { lineRule: value.lineRule } : {})
});

const coerceParagraphIndentation = (
  value: Record<string, unknown>
): ParagraphIndentation => ({
  ...(isNumber(value.leftTwip) ? { leftTwip: value.leftTwip } : {}),
  ...(isNumber(value.rightTwip) ? { rightTwip: value.rightTwip } : {}),
  ...(isNumber(value.firstLineTwip) ? { firstLineTwip: value.firstLineTwip } : {}),
  ...(isNumber(value.hangingTwip) ? { hangingTwip: value.hangingTwip } : {})
});

const coerceRunProperties = (value: unknown): RunProperties | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    ...(isRecord(value.font) ? { font: coerceFont(value.font) } : {}),
    ...(isNumber(value.sizeHalfPt) ? { sizeHalfPt: value.sizeHalfPt } : {}),
    ...(isBoolean(value.bold) ? { bold: value.bold } : {}),
    ...(isBoolean(value.italic) ? { italic: value.italic } : {}),
    ...(isUnderlineStyle(value.underline)
      ? { underline: value.underline }
      : {}),
    ...(isBoolean(value.strike) ? { strike: value.strike } : {}),
    ...(isString(value.color) ? { color: value.color } : {}),
    ...(isString(value.highlight) ? { highlight: value.highlight } : {}),
    ...(isBoolean(value.smallCaps) ? { smallCaps: value.smallCaps } : {}),
    ...(isBoolean(value.allCaps) ? { allCaps: value.allCaps } : {}),
    ...(isBoolean(value.superscript) ? { superscript: value.superscript } : {}),
    ...(isBoolean(value.subscript) ? { subscript: value.subscript } : {})
  };
};

const coerceFont = (value: Record<string, unknown>): FontProperties => ({
  ...(isString(value.ascii) ? { ascii: value.ascii } : {}),
  ...(isString(value.hAnsi) ? { hAnsi: value.hAnsi } : {}),
  ...(isString(value.cs) ? { cs: value.cs } : {}),
  ...(isString(value.eastAsia) ? { eastAsia: value.eastAsia } : {})
});

const coerceTableProperties = (value: unknown): TableProperties | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }
  const border = coerceBorderProperties(value.border);
  const shading = coerceShadingProperties(value.shading);

  return {
    ...(isNumber(value.widthPct) ? { widthPct: value.widthPct } : {}),
    ...(isNumber(value.cellMarginTwip)
      ? { cellMarginTwip: value.cellMarginTwip }
      : {}),
    ...(border === undefined ? {} : { border }),
    ...(shading === undefined ? {} : { shading })
  };
};

const coerceImageProperties = (value: unknown): ImageProperties | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    ...(isNumber(value.maxWidthEmu) ? { maxWidthEmu: value.maxWidthEmu } : {}),
    ...(isNumber(value.maxHeightEmu) ? { maxHeightEmu: value.maxHeightEmu } : {}),
    ...(isBoolean(value.preserveAspectRatio)
      ? { preserveAspectRatio: value.preserveAspectRatio }
      : {})
  };
};

const coerceBorderProperties = (value: unknown): BorderProperties | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    ...(isBorderStyle(value.style) ? { style: value.style } : {}),
    ...(isString(value.color) ? { color: value.color } : {}),
    ...(isNumber(value.sizeTwip) ? { sizeTwip: value.sizeTwip } : {})
  };
};

const coerceShadingProperties = (
  value: unknown
): ShadingProperties | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    ...(isString(value.fill) ? { fill: value.fill } : {})
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

const isNumber = (value: unknown): value is number => typeof value === "number";

const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

const paragraphAlignments = new Set<ParagraphAlignment>([
  "left",
  "center",
  "right",
  "both",
  "justify"
]);

const lineRules = new Set<LineRule>(["auto", "exact", "atLeast"]);

const underlineStyles = new Set<UnderlineStyle>(["none", "single", "double"]);

const borderStyles = new Set<BorderStyle>([
  "none",
  "single",
  "double",
  "dashed",
  "dotted"
]);

const isParagraphAlignment = (value: unknown): value is ParagraphAlignment =>
  isString(value) && paragraphAlignments.has(value as ParagraphAlignment);

const isLineRule = (value: unknown): value is LineRule =>
  isString(value) && lineRules.has(value as LineRule);

const isUnderlineStyle = (value: unknown): value is UnderlineStyle =>
  isString(value) && underlineStyles.has(value as UnderlineStyle);

const isBorderStyle = (value: unknown): value is BorderStyle =>
  isString(value) && borderStyles.has(value as BorderStyle);
