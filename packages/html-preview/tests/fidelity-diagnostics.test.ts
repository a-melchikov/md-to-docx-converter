import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { renderHtmlPreview } from "../src/index.js";
import { baseStyle, paragraphNode, resolvedDocument, textNode } from "./fixtures.js";

describe("fidelity diagnostics and dependencies", () => {
  it("reports fast preview mode and font fallback", () => {
    const result = renderHtmlPreview({
      document: resolvedDocument([
        paragraphNode([textNode("Font fallback", { run: { sizeHalfPt: 24 } })], {
          paragraph: baseStyle.paragraph,
          run: { sizeHalfPt: 24 }
        })
      ])
    });

    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(
      expect.arrayContaining([
        "preview.fidelity.fastMode",
        "preview.fidelity.fontFallback"
      ])
    );
  });

  it("does not depend on Mammoth or docx-preview", () => {
    const packageJson = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8")
    ) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    expect(dependencies.mammoth).toBeUndefined();
    expect(dependencies["docx-preview"]).toBeUndefined();
  });
});
