import { describe, expect, it } from "vitest";

import { parseMarkdown } from "../src/index.js";

describe("HTML policy", () => {
  it("warn-and-skip skips raw HTML", () => {
    const result = parseMarkdown({
      markdown: "<div>Hello</div>",
      options: { htmlPolicy: "warn-and-skip" }
    });

    expect(result.document.children).toEqual([]);
    expect(result.diagnostics[0]).toEqual(
      expect.objectContaining({
        severity: "warning",
        code: "markdown.unsupportedHtml"
      })
    );
  });

  it("fallback-text converts raw HTML to plain text", () => {
    const result = parseMarkdown({
      markdown: "<div>Hello <strong>world</strong></div>",
      options: { htmlPolicy: "fallback-text" }
    });
    const paragraph = result.document.children[0];

    expect(paragraph?.kind).toBe("paragraph");
    expect(
      paragraph?.kind === "paragraph" ? paragraph.children[0] : undefined
    ).toEqual(expect.objectContaining({ kind: "text", value: "Hello world" }));
    expect(result.diagnostics[0]?.code).toBe("markdown.unsupportedHtml");
  });

  it("error creates error diagnostic and unsupported marker", () => {
    const result = parseMarkdown({
      markdown: "<div>Hello</div>",
      options: { htmlPolicy: "error" }
    });

    expect(result.diagnostics[0]).toEqual(
      expect.objectContaining({
        severity: "error",
        code: "markdown.unsupportedHtml"
      })
    );
    expect(result.document.children[0]).toEqual(
      expect.objectContaining({
        kind: "unsupported-block",
        originalType: "html"
      })
    );
  });
});
