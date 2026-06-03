import { describe, expect, it } from "vitest";

import type { BlockNode, InlineNode } from "@md-to-docx/domain";

import { resolveStyles } from "../src/index.js";
import { cloneConfig, document, paragraph, text } from "./helpers.js";

describe("fallback styles", () => {
  it("creates a diagnostic when a named style is missing", () => {
    const config = cloneConfig();
    const styles = { ...config.styles };
    delete (styles as Partial<typeof styles>).heading1;
    const result = resolveStyles({
      document: document([
        { kind: "heading", level: 1, children: [text("Title")] }
      ]),
      config: { ...config, styles }
    });

    expect(result.diagnostics[0]).toEqual(
      expect.objectContaining({
        severity: "warning",
        code: "style.missing"
      })
    );
    expect(result.document.children[0]?.style.run?.bold).toBe(true);
  });

  it("creates diagnostics for unsupported block and inline nodes", () => {
    const unsupportedInline: InlineNode = {
      kind: "unsupported-inline",
      originalType: "footnoteReference"
    };
    const unsupportedBlock: BlockNode = {
      kind: "unsupported-block",
      originalType: "footnoteDefinition"
    };
    const result = resolveStyles({
      document: document([paragraph([unsupportedInline]), unsupportedBlock]),
      config: cloneConfig()
    });

    expect(
      result.diagnostics.filter(
        (diagnostic) => diagnostic.code === "style.unsupportedNode"
      )
    ).toHaveLength(2);
  });
});
