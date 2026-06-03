import {
  LevelFormat,
  type INumberingOptions
} from "docx";
import type {
  ResolvedBlockNode,
  ResolvedDocument,
  ResolvedLevelFormat,
  ResolvedNumberingInfo,
  ResolvedNumberingLevel
} from "@md-to-docx/domain";

import type { DocxBuilderContext } from "./builder-context.js";
import { createDocxDiagnostic, numberingFallbackMessage } from "./diagnostics.js";

export const orderedNumberingReference = "md-to-docx-ordered";
export const unorderedNumberingReference = "md-to-docx-unordered";

export const numberingOptions = (document: ResolvedDocument): INumberingOptions => {
  const levels = collectNumberingLevels(document);

  return {
    config: [
      {
        reference: unorderedNumberingReference,
        levels: buildLevels("unordered", levels.unordered)
      },
      {
        reference: orderedNumberingReference,
        levels: buildLevels("ordered", levels.ordered)
      }
    ]
  };
};

export const numberingParagraphOptions = (
  numbering: ResolvedNumberingInfo | undefined,
  context: DocxBuilderContext
) => {
  if (numbering === undefined) {
    context.diagnostics.push(
      createDocxDiagnostic({
        severity: "warning",
        code: "docx.numbering.fallback",
        message: numberingFallbackMessage()
      })
    );

    return {
      reference: unorderedNumberingReference,
      level: 0
    };
  }

  if (numbering.levelConfig === undefined) {
    context.diagnostics.push(
      createDocxDiagnostic({
        severity: "warning",
        code: "docx.numbering.fallback",
        message: numberingFallbackMessage(),
        metadata: { kind: numbering.kind, level: numbering.level }
      })
    );
  }

  return {
    reference:
      numbering.kind === "ordered"
        ? orderedNumberingReference
        : unorderedNumberingReference,
    level: Math.max(0, Math.min(8, numbering.level))
  };
};

export const numberingLevelToDocx = (
  level: ResolvedNumberingLevel
) => ({
  level: Math.max(0, Math.min(8, level.level)),
  format: mapLevelFormat(level.format),
  text: level.text,
  ...(level.start === undefined ? {} : { start: level.start }),
  style: {
    paragraph: {
      indent: {
        left: level.leftTwip,
        hanging: level.hangingTwip
      }
    }
  }
});

const buildLevels = (
  kind: "ordered" | "unordered",
  resolvedLevels: ReadonlyMap<number, ResolvedNumberingLevel>
) =>
  Array.from({ length: 9 }, (_, level) => {
    const resolved = resolvedLevels.get(level);

    return resolved === undefined
      ? fallbackLevel(kind, level)
      : numberingLevelToDocx(resolved);
  });

const fallbackLevel = (kind: "ordered" | "unordered", level: number) => ({
  level,
  format: kind === "ordered" ? LevelFormat.DECIMAL : LevelFormat.BULLET,
  text: kind === "ordered" ? `%${level + 1}.` : "\u2022",
  ...(kind === "ordered" ? { start: 1 } : {}),
  style: {
    paragraph: {
      indent: {
        left: 720 * (level + 1),
        hanging: 360
      }
    }
  }
});

const collectNumberingLevels = (
  document: ResolvedDocument
): {
  readonly ordered: ReadonlyMap<number, ResolvedNumberingLevel>;
  readonly unordered: ReadonlyMap<number, ResolvedNumberingLevel>;
} => {
  const ordered = new Map<number, ResolvedNumberingLevel>();
  const unordered = new Map<number, ResolvedNumberingLevel>();

  for (const child of document.children) {
    collectFromBlock(child, ordered, unordered);
  }

  return { ordered, unordered };
};

const collectFromBlock = (
  node: ResolvedBlockNode,
  ordered: Map<number, ResolvedNumberingLevel>,
  unordered: Map<number, ResolvedNumberingLevel>
): void => {
  switch (node.kind) {
    case "ordered-list":
      collectNumberingInfo(node.numbering, ordered, unordered);
      node.children.forEach((child) => collectFromBlock(child, ordered, unordered));
      break;
    case "unordered-list":
      collectNumberingInfo(node.numbering, ordered, unordered);
      node.children.forEach((child) => collectFromBlock(child, ordered, unordered));
      break;
    case "list-item":
      collectNumberingInfo(node.numbering, ordered, unordered);
      node.children.forEach((child) => collectFromBlock(child, ordered, unordered));
      break;
    case "blockquote":
    case "table-cell":
      node.children.forEach((child) => collectFromBlock(child, ordered, unordered));
      break;
    case "table":
      node.children.forEach((row) => collectFromBlock(row, ordered, unordered));
      break;
    case "table-row":
      node.children.forEach((cell) => collectFromBlock(cell, ordered, unordered));
      break;
    case "paragraph":
    case "heading":
    case "code-block":
    case "thematic-break":
    case "image-block":
    case "unsupported-block":
      break;
  }
};

const collectNumberingInfo = (
  numbering: ResolvedNumberingInfo | undefined,
  ordered: Map<number, ResolvedNumberingLevel>,
  unordered: Map<number, ResolvedNumberingLevel>
): void => {
  if (numbering?.levelConfig === undefined) {
    return;
  }

  const target = numbering.kind === "ordered" ? ordered : unordered;
  target.set(numbering.levelConfig.level, numbering.levelConfig);
};

const mapLevelFormat = (format: ResolvedLevelFormat) => {
  switch (format) {
    case "bullet":
      return LevelFormat.BULLET;
    case "lowerLetter":
      return LevelFormat.LOWER_LETTER;
    case "upperLetter":
      return LevelFormat.UPPER_LETTER;
    case "lowerRoman":
      return LevelFormat.LOWER_ROMAN;
    case "upperRoman":
      return LevelFormat.UPPER_ROMAN;
    case "decimal":
      return LevelFormat.DECIMAL;
  }
};
