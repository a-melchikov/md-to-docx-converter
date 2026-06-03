import {
  AlignmentType,
  BorderStyle,
  LineRuleType,
  ShadingType,
  UnderlineType,
  WidthType,
  type IBorderOptions,
  type IBordersOptions,
  type IParagraphOptions,
  type IRunOptions,
  type IShadingAttributesProperties,
  type ITableBordersOptions,
  type ITableCellOptions,
  type ITableOptions
} from "docx";
import type {
  ResolvedBorderProperties,
  ResolvedLineRule,
  ResolvedParagraphAlignment,
  ResolvedShadingProperties,
  ResolvedStyleSet
} from "@md-to-docx/domain";

import type { DocxBuilderContext } from "./builder-context.js";
import { createDocxDiagnostic, styleFallbackMessage } from "./diagnostics.js";

export const paragraphOptionsFromStyle = (
  style: ResolvedStyleSet,
  context: DocxBuilderContext,
  kind: string,
  requireParagraphStyle = true
): Omit<IParagraphOptions, "children" | "text"> => {
  const paragraph = style.paragraph;

  if (paragraph === undefined && requireParagraphStyle) {
    context.diagnostics.push(
      createDocxDiagnostic({
        severity: "warning",
        code: "docx.style.fallback",
        message: styleFallbackMessage(kind)
      })
    );
  }

  return {
    ...(paragraph?.alignment === undefined
      ? {}
      : { alignment: mapAlignment(paragraph.alignment) }),
    ...(paragraph?.spacing === undefined
      ? {}
      : {
          spacing: {
            ...(paragraph.spacing.beforeTwip === undefined
              ? {}
              : { before: paragraph.spacing.beforeTwip }),
            ...(paragraph.spacing.afterTwip === undefined
              ? {}
              : { after: paragraph.spacing.afterTwip }),
            ...(paragraph.spacing.lineTwip === undefined
              ? {}
              : { line: paragraph.spacing.lineTwip }),
            ...(paragraph.spacing.lineRule === undefined
              ? {}
              : { lineRule: mapLineRule(paragraph.spacing.lineRule) })
          }
        }),
    ...(paragraph?.indentation === undefined
      ? {}
      : {
          indent: {
            ...(paragraph.indentation.leftTwip === undefined
              ? {}
              : { left: paragraph.indentation.leftTwip }),
            ...(paragraph.indentation.rightTwip === undefined
              ? {}
              : { right: paragraph.indentation.rightTwip }),
            ...(paragraph.indentation.firstLineTwip === undefined
              ? {}
              : { firstLine: paragraph.indentation.firstLineTwip }),
            ...(paragraph.indentation.hangingTwip === undefined
              ? {}
              : { hanging: paragraph.indentation.hangingTwip })
          }
        }),
    ...(paragraph?.keepNext === undefined ? {} : { keepNext: paragraph.keepNext }),
    ...(paragraph?.keepLines === undefined ? {} : { keepLines: paragraph.keepLines }),
    ...(paragraph?.widowControl === undefined
      ? {}
      : { widowControl: paragraph.widowControl }),
    ...(paragraph?.pageBreakBefore === undefined
      ? {}
      : { pageBreakBefore: paragraph.pageBreakBefore }),
    ...(style.border === undefined
      ? {}
      : { border: paragraphBorders(style.border) }),
    ...(style.shading === undefined ? {} : { shading: shadingOptions(style.shading) })
  };
};

export const runOptionsFromStyle = (
  style: ResolvedStyleSet,
  context: DocxBuilderContext,
  kind: string,
  requireRunStyle = true
): Omit<IRunOptions, "text" | "children" | "break"> => {
  const run = style.run;
  const fontName =
    run?.font?.ascii ??
    run?.font?.hAnsi ??
    run?.font?.cs ??
    run?.font?.eastAsia;

  if (run === undefined && requireRunStyle) {
    context.diagnostics.push(
      createDocxDiagnostic({
        severity: "warning",
        code: "docx.style.fallback",
        message: styleFallbackMessage(kind)
      })
    );
  }

  if (run?.highlight !== undefined) {
    context.diagnostics.push(
      createDocxDiagnostic({
        severity: "warning",
        code: "docx.style.unsupportedProperty",
        message: `Свойство стиля "highlight" не поддерживается DOCX adapter MVP.`,
        metadata: { property: "highlight" }
      })
    );
  }

  return {
    ...(run?.bold === undefined ? {} : { bold: run.bold }),
    ...(run?.italic === undefined ? {} : { italics: run.italic }),
    ...(run?.strike === undefined ? {} : { strike: run.strike }),
    ...(run?.underline === undefined || run.underline === "none"
      ? {}
      : { underline: { type: mapUnderline(run.underline) } }),
    ...(run?.color === undefined ? {} : { color: run.color }),
    ...(run?.sizeHalfPt === undefined ? {} : { size: run.sizeHalfPt }),
    ...(fontName === undefined ? {} : { font: fontName }),
    ...(run?.smallCaps === undefined ? {} : { smallCaps: run.smallCaps }),
    ...(run?.allCaps === undefined ? {} : { allCaps: run.allCaps }),
    ...(run?.superscript === true ? { superScript: true } : {}),
    ...(run?.subscript === true ? { subScript: true } : {}),
    ...(style.shading === undefined
      ? {}
      : { shading: shadingOptions(style.shading) }),
    ...(style.border === undefined ? {} : { border: borderOptions(style.border) })
  };
};

export const tableOptionsFromStyle = (
  style: ResolvedStyleSet
): Partial<Omit<ITableOptions, "rows">> => {
  const table = style.table;

  return {
    ...(table?.widthPct === undefined
      ? {}
      : { width: { size: table.widthPct, type: WidthType.PERCENTAGE } }),
    ...(table?.cellMarginTwip === undefined
      ? {}
      : {
          margins: {
            top: table.cellMarginTwip,
            bottom: table.cellMarginTwip,
            left: table.cellMarginTwip,
            right: table.cellMarginTwip
          }
        }),
    ...(table?.border === undefined ? {} : { borders: tableBorders(table.border) }),
    ...(table?.shading === undefined ? {} : { shading: shadingOptions(table.shading) })
  };
};

export const tableCellOptionsFromStyle = (
  style: ResolvedStyleSet
): Partial<Omit<ITableCellOptions, "children">> => ({
  ...(style.shading === undefined ? {} : { shading: shadingOptions(style.shading) }),
  ...(style.border === undefined ? {} : { borders: cellBorders(style.border) }),
  ...(style.table?.cellMarginTwip === undefined
    ? {}
    : {
        margins: {
          top: style.table.cellMarginTwip,
          bottom: style.table.cellMarginTwip,
          left: style.table.cellMarginTwip,
          right: style.table.cellMarginTwip
        }
      })
});

export const borderOptions = (
  border: ResolvedBorderProperties
): IBorderOptions => ({
  style: mapBorderStyle(border.style),
  ...(border.color === undefined ? {} : { color: border.color }),
  ...(border.sizeTwip === undefined ? {} : { size: border.sizeTwip })
});

const tableBorders = (
  border: ResolvedBorderProperties
): ITableBordersOptions => {
  const mapped = borderOptions(border);

  return {
    top: mapped,
    bottom: mapped,
    left: mapped,
    right: mapped,
    insideHorizontal: mapped,
    insideVertical: mapped
  };
};

const paragraphBorders = (border: ResolvedBorderProperties): IBordersOptions => {
  const mapped = borderOptions(border);

  return {
    left: mapped
  };
};

const cellBorders = (border: ResolvedBorderProperties) => {
  const mapped = borderOptions(border);

  return {
    top: mapped,
    bottom: mapped,
    left: mapped,
    right: mapped
  };
};

const shadingOptions = (
  shading: ResolvedShadingProperties
): IShadingAttributesProperties => ({
  ...(shading.fill === undefined ? {} : { fill: shading.fill }),
  color: "auto",
  type: ShadingType.CLEAR
});

const mapAlignment = (alignment: ResolvedParagraphAlignment) => {
  switch (alignment) {
    case "center":
      return AlignmentType.CENTER;
    case "right":
      return AlignmentType.RIGHT;
    case "both":
    case "justify":
      return AlignmentType.JUSTIFIED;
    case "left":
      return AlignmentType.LEFT;
  }
};

const mapLineRule = (lineRule: ResolvedLineRule) => {
  switch (lineRule) {
    case "atLeast":
      return LineRuleType.AT_LEAST;
    case "exact":
      return LineRuleType.EXACT;
    case "auto":
      return LineRuleType.AUTO;
  }
};

const mapUnderline = (underline: "single" | "double") =>
  underline === "double" ? UnderlineType.DOUBLE : UnderlineType.SINGLE;

const mapBorderStyle = (style: ResolvedBorderProperties["style"]) => {
  switch (style) {
    case "double":
      return BorderStyle.DOUBLE;
    case "dashed":
      return BorderStyle.DASHED;
    case "dotted":
      return BorderStyle.DOTTED;
    case "none":
      return BorderStyle.NONE;
    case "single":
    case undefined:
      return BorderStyle.SINGLE;
  }
};
