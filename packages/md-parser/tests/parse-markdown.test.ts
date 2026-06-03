import { describe, expect, it } from "vitest";

import type { BlockNode, InlineNode, ParagraphNode } from "@md-to-docx/domain";

import { parseMarkdown } from "../src/index.js";

const firstBlock = (markdown: string): BlockNode =>
  parseMarkdown({ markdown }).document.children[0] as BlockNode;

const firstParagraph = (markdown: string): ParagraphNode =>
  firstBlock(markdown) as ParagraphNode;

const textValue = (node: InlineNode): string =>
  node.kind === "text" ? node.value : "";

describe("parseMarkdown", () => {
  it("parses heading h1-h6", () => {
    const markdown = [1, 2, 3, 4, 5, 6]
      .map((level) => `${"#".repeat(level)} Heading ${level}`)
      .join("\n\n");
    const result = parseMarkdown({ markdown });

    expect(result.document.children).toHaveLength(6);
    expect(
      result.document.children.map((node) =>
        node.kind === "heading" ? node.level : null
      )
    ).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("parses paragraph with inline text", () => {
    const paragraph = firstParagraph("Plain paragraph.");

    expect(paragraph.kind).toBe("paragraph");
    expect(paragraph.children.map(textValue).join("")).toBe("Plain paragraph.");
  });

  it("parses strong, emphasis, and strikethrough", () => {
    const paragraph = firstParagraph("**bold** *em* ~~gone~~");

    expect(paragraph.children.map((node) => node.kind)).toEqual([
      "strong",
      "text",
      "emphasis",
      "text",
      "strikethrough"
    ]);
  });

  it("parses inline code", () => {
    const paragraph = firstParagraph("Use `code` now.");

    expect(paragraph.children[1]).toEqual(
      expect.objectContaining({ kind: "inline-code", value: "code" })
    );
  });

  it("parses fenced code block with language", () => {
    const block = firstBlock("```ts\nconst value = 1;\n```");

    expect(block).toEqual(
      expect.objectContaining({
        kind: "code-block",
        language: "ts",
        value: "const value = 1;"
      })
    );
  });

  it("parses unordered list", () => {
    const list = firstBlock("- one\n- two");

    expect(list.kind).toBe("unordered-list");
    expect(list.children).toHaveLength(2);
  });

  it("parses ordered list", () => {
    const list = firstBlock("3. one\n4. two");

    expect(list).toEqual(
      expect.objectContaining({ kind: "ordered-list", start: 3 })
    );
    expect(list.children).toHaveLength(2);
  });

  it("parses nested lists", () => {
    const list = firstBlock("- parent\n  - child");

    expect(list.kind).toBe("unordered-list");
    const parent = list.children[0];
    expect(parent?.kind).toBe("list-item");
    expect(parent?.children.some((node) => node.kind === "unordered-list")).toBe(
      true
    );
  });

  it("parses task list items", () => {
    const list = firstBlock("- [x] done\n- [ ] todo");

    expect(list.kind).toBe("unordered-list");
    expect(list.children.map((item) => item.checked)).toEqual([true, false]);
  });

  it("parses blockquote", () => {
    const blockquote = firstBlock("> quoted");

    expect(blockquote.kind).toBe("blockquote");
    expect(blockquote.children[0]?.kind).toBe("paragraph");
  });

  it("parses thematic break", () => {
    const thematicBreak = firstBlock("---");

    expect(thematicBreak.kind).toBe("thematic-break");
  });

  it("parses GFM table", () => {
    const table = firstBlock("| A | B |\n| - | - |\n| 1 | 2 |");

    expect(table.kind).toBe("table");
    expect(table.children).toHaveLength(2);
    expect(table.children[0]?.children[0]?.kind).toBe("table-cell");
  });

  it("parses link", () => {
    const paragraph = firstParagraph("[OpenAI](https://openai.com \"OpenAI\")");

    expect(paragraph.children[0]).toEqual(
      expect.objectContaining({
        kind: "link",
        href: "https://openai.com",
        title: "OpenAI"
      })
    );
  });

  it("parses image", () => {
    const paragraph = firstParagraph("![Alt](image.png \"Title\")");

    expect(paragraph.children[0]).toEqual(
      expect.objectContaining({
        kind: "inline-image",
        src: "image.png",
        alt: "Alt",
        title: "Title"
      })
    );
  });

  it("parses hard and soft breaks", () => {
    const result = parseMarkdown({ markdown: "soft\nbreak\nhard  \nbreak" });
    const paragraph = result.document.children[0] as ParagraphNode;

    expect(paragraph.children.map((node) => node.kind)).toContain("soft-break");
    expect(paragraph.children.map((node) => node.kind)).toContain("hard-break");
  });

  it("does not enable GFM tables for commonmark profile", () => {
    const block = firstBlock("| A | B |\n| - | - |\n| 1 | 2 |");
    const commonmark = parseMarkdown({
      markdown: "| A | B |\n| - | - |\n| 1 | 2 |",
      options: { markdownProfile: "commonmark" }
    });

    expect(block.kind).toBe("table");
    expect(commonmark.document.children[0]?.kind).toBe("paragraph");
  });

  it("does not crash on empty Markdown", () => {
    const result = parseMarkdown({ markdown: "" });

    expect(result.document.children).toEqual([]);
    expect(result.diagnostics).toEqual([]);
  });

  it("does not crash on whitespace-only Markdown", () => {
    const result = parseMarkdown({ markdown: "  \n\t\n" });

    expect(result.document.children).toEqual([]);
    expect(result.diagnostics).toEqual([]);
  });
});
