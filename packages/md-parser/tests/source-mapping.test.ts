import { describe, expect, it } from "vitest";

import { parseMarkdown } from "../src/index.js";

describe("source mapping", () => {
  it("maps mdast source position to intermediate nodes", () => {
    const result = parseMarkdown({
      markdown: "# Title\n\nParagraph",
      fileName: "input.md"
    });
    const heading = result.document.children[0];

    expect(heading?.source).toEqual(
      expect.objectContaining({
        file: "input.md",
        start: expect.objectContaining({ line: 1, column: 1, offset: 0 }),
        end: expect.objectContaining({ line: 1, column: 8 })
      })
    );
    expect(heading?.path).toEqual([
      { type: "root", name: "document" },
      { type: "field", name: "children" },
      { type: "index", index: 0 }
    ]);
  });

  it("adds source mapping to diagnostics", () => {
    const result = parseMarkdown({
      markdown: "<div>HTML</div>",
      fileName: "input.md",
      options: { htmlPolicy: "warn-and-skip" }
    });

    expect(result.diagnostics[0]?.source).toEqual(
      expect.objectContaining({
        file: "input.md",
        start: expect.objectContaining({ line: 1, column: 1 })
      })
    );
  });
});
