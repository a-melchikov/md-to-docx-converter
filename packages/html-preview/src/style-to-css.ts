import type {
  ResolvedBorderProperties,
  ResolvedParagraphAlignment,
  ResolvedRunProperties,
  ResolvedStyleSet
} from "@md-to-docx/domain";

import {
  cssPt,
  cssPx,
  emuToPx,
  halfPointToPt,
  twipToPx
} from "./page-layout.js";

export const paragraphStyleToCss = (style: ResolvedStyleSet): string =>
  cssDeclarations({
    "text-align": mapAlignment(style.paragraph?.alignment),
    "margin-top":
      style.paragraph?.spacing?.beforeTwip === undefined
        ? undefined
        : cssPx(twipToPx(style.paragraph.spacing.beforeTwip)),
    "margin-bottom":
      style.paragraph?.spacing?.afterTwip === undefined
        ? undefined
        : cssPx(twipToPx(style.paragraph.spacing.afterTwip)),
    "line-height":
      style.paragraph?.spacing?.lineTwip === undefined
        ? undefined
        : cssPx(twipToPx(style.paragraph.spacing.lineTwip)),
    "margin-left":
      style.paragraph?.indentation?.leftTwip === undefined
        ? undefined
        : cssPx(twipToPx(style.paragraph.indentation.leftTwip)),
    "margin-right":
      style.paragraph?.indentation?.rightTwip === undefined
        ? undefined
        : cssPx(twipToPx(style.paragraph.indentation.rightTwip)),
    "text-indent": textIndent(style),
    "break-before":
      style.paragraph?.pageBreakBefore === true ? "page" : undefined,
    ...borderCss(style.border, "left"),
    ...shadingCss(style)
  });

export const runStyleToCss = (style: ResolvedStyleSet): string =>
  cssDeclarations({
    "font-family": fontFamily(style.run),
    "font-size":
      style.run?.sizeHalfPt === undefined
        ? undefined
        : cssPt(halfPointToPt(style.run.sizeHalfPt)),
    "font-weight": style.run?.bold === true ? "700" : undefined,
    "font-style": style.run?.italic === true ? "italic" : undefined,
    "text-decoration": textDecoration(style.run),
    color: style.run?.color === undefined ? undefined : `#${style.run.color}`,
    "background-color":
      style.run?.highlight === undefined ? undefined : `#${style.run.highlight}`,
    "font-variant": style.run?.smallCaps === true ? "small-caps" : undefined,
    "text-transform": style.run?.allCaps === true ? "uppercase" : undefined,
    "vertical-align":
      style.run?.superscript === true
        ? "super"
        : style.run?.subscript === true
          ? "sub"
          : undefined,
    ...shadingCss(style)
  });

export const codeBlockStyleToCss = (style: ResolvedStyleSet): string =>
  cssDeclarations({
    ...parseCss(paragraphStyleToCss(style)),
    ...parseCss(runStyleToCss(style)),
    "font-family": fontFamily(style.run) ?? "Courier New, monospace",
    "background-color": style.shading?.fill === undefined ? "#f7f7f7" : `#${style.shading.fill}`,
    padding: "8px 10px",
    border: borderValue(style.border)
  });

export const tableStyleToCss = (style: ResolvedStyleSet): string => {
  const table = style.table;

  return cssDeclarations({
    width:
      table?.widthPct === undefined ? undefined : `${Math.min(100, table.widthPct)}%`,
    ...borderCss(table?.border, "all"),
    ...shadingCss(style)
  });
};

export const tableCellStyleToCss = (style: ResolvedStyleSet): string => {
  const table = style.table;

  return cssDeclarations({
    padding:
      table?.cellMarginTwip === undefined
        ? "4px 6px"
        : cssPx(twipToPx(table.cellMarginTwip)),
    ...borderCss(style.border ?? table?.border, "all"),
    ...shadingCss(style)
  });
};

export const imageStyleToCss = (style: ResolvedStyleSet): string =>
  cssDeclarations({
    "max-width":
      style.image?.maxWidthEmu === undefined
        ? "100%"
        : cssPx(emuToPx(style.image.maxWidthEmu)),
    "max-height":
      style.image?.maxHeightEmu === undefined
        ? undefined
        : cssPx(emuToPx(style.image.maxHeightEmu))
  });

export const listStyleToCss = (style: ResolvedStyleSet): string =>
  cssDeclarations({
    "margin-top":
      style.paragraph?.spacing?.beforeTwip === undefined
        ? undefined
        : cssPx(twipToPx(style.paragraph.spacing.beforeTwip)),
    "margin-bottom":
      style.paragraph?.spacing?.afterTwip === undefined
        ? undefined
        : cssPx(twipToPx(style.paragraph.spacing.afterTwip)),
    "padding-left":
      style.paragraph?.indentation?.leftTwip === undefined
        ? undefined
        : cssPx(twipToPx(style.paragraph.indentation.leftTwip))
  });

export const cssDeclarations = (
  declarations: Record<string, string | undefined>
): string =>
  Object.entries(declarations)
    .filter((entry): entry is [string, string] => entry[1] !== undefined)
    .map(([property, value]) => `${property}: ${value}`)
    .join("; ");

const mapAlignment = (
  alignment: ResolvedParagraphAlignment | undefined
): string | undefined => {
  if (alignment === "both") {
    return "justify";
  }

  return alignment;
};

const textIndent = (style: ResolvedStyleSet): string | undefined => {
  if (style.paragraph?.indentation?.firstLineTwip !== undefined) {
    return cssPx(twipToPx(style.paragraph.indentation.firstLineTwip));
  }

  if (style.paragraph?.indentation?.hangingTwip !== undefined) {
    return cssPx(-twipToPx(style.paragraph.indentation.hangingTwip));
  }

  return undefined;
};

const fontFamily = (run: ResolvedRunProperties | undefined): string | undefined => {
  const font = run?.font?.ascii ?? run?.font?.hAnsi ?? run?.font?.cs ?? run?.font?.eastAsia;

  return font === undefined ? undefined : `"${font.replace(/"/g, "")}"`;
};

const textDecoration = (run: ResolvedRunProperties | undefined): string | undefined => {
  const decorations = [
    run?.underline === undefined || run.underline === "none" ? undefined : "underline",
    run?.strike === true ? "line-through" : undefined
  ].filter((value): value is string => value !== undefined);

  return decorations.length === 0 ? undefined : decorations.join(" ");
};

const borderCss = (
  border: ResolvedBorderProperties | undefined,
  mode: "all" | "left"
): Record<string, string | undefined> => {
  const value = borderValue(border);

  if (value === undefined) {
    return {};
  }

  return mode === "all" ? { border: value } : { "border-left": value, "padding-left": "8px" };
};

const borderValue = (
  border: ResolvedBorderProperties | undefined
): string | undefined => {
  if (border === undefined || border.style === "none") {
    return undefined;
  }

  return `${border.sizeTwip === undefined ? 1 : Math.max(1, Math.round(twipToPx(border.sizeTwip)))}px ${mapBorderStyle(border.style)} #${border.color ?? "808080"}`;
};

const mapBorderStyle = (
  style: ResolvedBorderProperties["style"]
): string => {
  switch (style) {
    case "double":
      return "double";
    case "dashed":
      return "dashed";
    case "dotted":
      return "dotted";
    case "none":
      return "none";
    case "single":
    case undefined:
      return "solid";
  }
};

const shadingCss = (
  style: Pick<ResolvedStyleSet, "shading">
): Record<string, string | undefined> =>
  style.shading?.fill === undefined
    ? {}
    : { "background-color": `#${style.shading.fill}` };

const parseCss = (css: string): Record<string, string> =>
  Object.fromEntries(
    css
      .split(";")
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part) => {
        const separator = part.indexOf(":");
        return [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
      })
  );
