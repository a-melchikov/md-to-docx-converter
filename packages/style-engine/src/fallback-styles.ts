import type { StyleDefinition } from "@md-to-docx/config-schema";

import type { StyleKey } from "./mappings.js";

export const fallbackStyleForKey = (styleKey: StyleKey): StyleDefinition => {
  if (styleKey.startsWith("heading")) {
    return {
      paragraph: {
        spacing: { beforeTwip: 240, afterTwip: 120 },
        keepNext: true
      },
      run: { bold: true }
    };
  }

  if (styleKey === "inlineCode" || styleKey === "codeBlock") {
    return {
      run: {
        font: { ascii: "Courier New", hAnsi: "Courier New", cs: "Courier New" }
      },
      shading: { fill: "F2F2F2" }
    };
  }

  if (styleKey === "link") {
    return { run: { color: "0563C1", underline: "single" } };
  }

  if (styleKey === "table") {
    return { table: { widthPct: 100, cellMarginTwip: 120 } };
  }

  if (styleKey === "image") {
    return { image: { preserveAspectRatio: true } };
  }

  if (styleKey === "thematicBreak") {
    return { border: { style: "single", color: "808080", sizeTwip: 4 } };
  }

  return {};
};
