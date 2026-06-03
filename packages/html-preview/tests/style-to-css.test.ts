import { describe, expect, it } from "vitest";

import {
  codeBlockStyleToCss,
  paragraphStyleToCss,
  runStyleToCss,
  tableCellStyleToCss,
  tableStyleToCss
} from "../src/style-to-css.js";
import { baseStyle, codeStyle, tableStyle } from "./fixtures.js";

describe("style-to-css", () => {
  it("maps paragraph properties", () => {
    const css = paragraphStyleToCss(baseStyle);

    expect(css).toContain("text-align: left");
    expect(css).toContain("margin-bottom: 10.667px");
    expect(css).toContain("line-height: 18.4px");
  });

  it("maps run properties", () => {
    const css = runStyleToCss({
      run: {
        font: { ascii: "Times New Roman" },
        sizeHalfPt: 24,
        bold: true,
        italic: true,
        underline: "single",
        strike: true,
        color: "FF0000",
        highlight: "FFFF00"
      }
    });

    expect(css).toContain("font-family: \"Times New Roman\"");
    expect(css).toContain("font-size: 12pt");
    expect(css).toContain("font-weight: 700");
    expect(css).toContain("text-decoration: underline line-through");
    expect(css).toContain("color: #FF0000");
    expect(css).toContain("background-color: #FFFF00");
  });

  it("maps code, table and cell styles", () => {
    expect(codeBlockStyleToCss(codeStyle)).toContain("Courier New");
    expect(tableStyleToCss(tableStyle)).toContain("width: 100%");
    expect(tableCellStyleToCss({ ...tableStyle, shading: { fill: "EDEDED" } })).toContain(
      "background-color: #EDEDED"
    );
  });
});
