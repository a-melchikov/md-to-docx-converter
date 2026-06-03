import { describe, expect, it } from "vitest";

import { parseMarkdown } from "../src/index.js";

describe("unsupported nodes", () => {
  it("returns diagnostics for unsupported nodes", () => {
    const result = parseMarkdown({
      markdown: "[^1]\n\n[^1]: Footnote",
      options: { onUnsupportedNode: "warn-and-skip" }
    });

    expect(result.diagnostics.some((diagnostic) => diagnostic.code === "markdown.unsupportedNode")).toBe(
      true
    );
  });

  it("uses fallback text policy for unsupported nodes", () => {
    const result = parseMarkdown({
      markdown: "[^1]\n\n[^1]: Footnote",
      options: { onUnsupportedNode: "fallback-text" }
    });

    expect(result.diagnostics.some((diagnostic) => diagnostic.code === "markdown.unsupportedNode")).toBe(
      true
    );
    expect(result.document.children.some((node) => node.kind === "paragraph")).toBe(
      true
    );
  });

  it("uses error policy for unsupported nodes", () => {
    const result = parseMarkdown({
      markdown: "[^1]\n\n[^1]: Footnote",
      options: { onUnsupportedNode: "error" }
    });

    expect(result.diagnostics.some((diagnostic) => diagnostic.severity === "error")).toBe(
      true
    );
  });
});
