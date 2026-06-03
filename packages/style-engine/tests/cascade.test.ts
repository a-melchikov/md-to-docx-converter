import { describe, expect, it } from "vitest";

import type { BlockNode } from "@md-to-docx/domain";

import { mergeStyleSets, resolveStyles } from "../src/index.js";
import { cloneConfig, document, paragraph, styleAttrs, text } from "./helpers.js";

describe("style cascade", () => {
  it("does not overwrite existing values with undefined", () => {
    const merged = mergeStyleSets(
      {
        run: { font: { ascii: "Times New Roman" }, bold: true },
        paragraph: { spacing: { afterTwip: 160 } }
      },
      {
        run: { font: { hAnsi: "Arial" } },
        paragraph: { spacing: {} }
      }
    );

    expect(merged.run?.font?.ascii).toBe("Times New Roman");
    expect(merged.run?.font?.hAnsi).toBe("Arial");
    expect(merged.run?.bold).toBe(true);
    expect(merged.paragraph?.spacing?.afterTwip).toBe(160);
  });

  it("applies direct override with the highest priority", () => {
    const result = resolveStyles({
      document: document([
        paragraph(
          [text("Hello")],
          styleAttrs({
            paragraph: { spacing: { afterTwip: 999 } },
            run: { bold: true, sizeHalfPt: 48 }
          })
        )
      ]),
      config: cloneConfig()
    });
    const resolved = result.document.children[0];

    expect(resolved?.style.paragraph?.spacing?.afterTwip).toBe(999);
    expect(resolved?.style.run?.bold).toBe(true);
    expect(resolved?.style.run?.sizeHalfPt).toBe(48);
  });

  it("keeps defaults when invalid unit conversion omits an override value", () => {
    const config = cloneConfig();
    config.styles.paragraph = {
      paragraph: { spacing: { afterTwip: -1 } }
    };
    const result = resolveStyles({
      document: document([paragraph([text("Hello")])]),
      config
    });

    expect(result.document.children[0]?.style.paragraph?.spacing?.afterTwip).toBe(160);
    expect(result.diagnostics.some((diagnostic) => diagnostic.code === "style.unitConversionError")).toBe(
      true
    );
  });

  it("resolves image block properties", () => {
    const image: BlockNode = {
      kind: "image-block",
      src: "image.png",
      alt: "Alt"
    };
    const result = resolveStyles({
      document: document([image]),
      config: cloneConfig()
    });

    expect(result.document.children[0]?.style.image?.maxWidthEmu).toBe(5486400);
    expect(result.document.children[0]?.style.image?.preserveAspectRatio).toBe(
      true
    );
  });
});
