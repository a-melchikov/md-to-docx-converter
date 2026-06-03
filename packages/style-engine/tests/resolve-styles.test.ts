import { describe, expect, it } from "vitest";

import type { BlockNode, InlineNode } from "@md-to-docx/domain";

import { resolveStyles } from "../src/index.js";
import { cloneConfig, document, paragraph, text } from "./helpers.js";

describe("resolveStyles", () => {
  it("applies paragraph defaults", () => {
    const result = resolveStyles({
      document: document([paragraph([text("Hello")])]),
      config: cloneConfig()
    });
    const resolved = result.document.children[0];

    expect(resolved?.kind).toBe("paragraph");
    expect(resolved?.style.paragraph?.spacing?.afterTwip).toBe(160);
    expect(resolved?.style.run?.font?.ascii).toBe("Times New Roman");
  });

  it("applies heading1 style", () => {
    const heading: BlockNode = {
      kind: "heading",
      level: 1,
      path: [{ type: "root", name: "document" }],
      children: [text("Title")]
    };
    const result = resolveStyles({
      document: document([heading]),
      config: cloneConfig()
    });
    const resolved = result.document.children[0];

    expect(resolved?.kind).toBe("heading");
    expect(resolved?.style.run?.sizeHalfPt).toBe(32);
    expect(resolved?.style.run?.bold).toBe(true);
  });

  it("applies heading2-heading6 styles", () => {
    const headings: readonly BlockNode[] = [2, 3, 4, 5, 6].map((level) => ({
      kind: "heading",
      level,
      children: [text(`Heading ${level}`)]
    })) as readonly BlockNode[];
    const result = resolveStyles({
      document: document(headings),
      config: cloneConfig()
    });

    expect(result.document.children.map((node) => node.style.run?.sizeHalfPt)).toEqual([
      28,
      26,
      24,
      22,
      20
    ]);
  });

  it("applies inline code and code block styles", () => {
    const inlineCode: InlineNode = {
      kind: "inline-code",
      value: "value"
    };
    const codeBlock: BlockNode = {
      kind: "code-block",
      value: "const value = 1;",
      language: "ts"
    };
    const result = resolveStyles({
      document: document([paragraph([inlineCode]), codeBlock]),
      config: cloneConfig()
    });
    const resolvedParagraph = result.document.children[0];
    const resolvedCodeBlock = result.document.children[1];

    expect(
      resolvedParagraph?.kind === "paragraph"
        ? resolvedParagraph.children[0]?.style.run?.font?.ascii
        : undefined
    ).toBe("Courier New");
    expect(resolvedCodeBlock?.style.run?.font?.ascii).toBe("Courier New");
  });

  it("applies strong, emphasis and strikethrough run overrides", () => {
    const children: readonly InlineNode[] = [
      { kind: "strong", children: [text("bold")] },
      { kind: "emphasis", children: [text("italic")] },
      { kind: "strikethrough", children: [text("strike")] }
    ];
    const result = resolveStyles({
      document: document([paragraph(children)]),
      config: cloneConfig()
    });
    const resolved = result.document.children[0];
    const inlineChildren =
      resolved?.kind === "paragraph" ? resolved.children : [];

    expect(inlineChildren[0]?.style.run?.bold).toBe(true);
    expect(inlineChildren[1]?.style.run?.italic).toBe(true);
    expect(inlineChildren[2]?.style.run?.strike).toBe(true);
  });

  it("applies blockquote, lists, table and cell styles", () => {
    const blockquote: BlockNode = {
      kind: "blockquote",
      children: [paragraph([text("Quote")])]
    };
    const unordered: BlockNode = {
      kind: "unordered-list",
      children: [{ kind: "list-item", checked: true, children: [paragraph([text("Task")])] }]
    };
    const ordered: BlockNode = {
      kind: "ordered-list",
      start: 3,
      children: [{ kind: "list-item", children: [paragraph([text("One")])] }]
    };
    const table: BlockNode = {
      kind: "table",
      children: [
        {
          kind: "table-row",
          children: [
            { kind: "table-cell", children: [paragraph([text("Head")])] }
          ]
        },
        {
          kind: "table-row",
          children: [{ kind: "table-cell", children: [paragraph([text("Cell")])] }]
        }
      ]
    };
    const result = resolveStyles({
      document: document([blockquote, unordered, ordered, table]),
      config: cloneConfig()
    });

    expect(result.document.children[0]?.style.border?.color).toBe("808080");
    expect(result.document.children[1]?.kind).toBe("unordered-list");
    expect(
      result.document.children[1]?.kind === "unordered-list"
        ? result.document.children[1].children[0]?.numbering?.checked
        : undefined
    ).toBe(true);
    expect(
      result.document.children[2]?.kind === "ordered-list"
        ? result.document.children[2].numbering.levelConfig?.format
        : undefined
    ).toBe("decimal");
    expect(result.document.children[3]?.style.table?.widthPct).toBe(100);
    expect(
      result.document.children[3]?.kind === "table"
        ? result.document.children[3].children[0]?.children[0]?.style.shading?.fill
        : undefined
    ).toBe("EDEDED");
  });

  it("preserves source and path for adapter traversal", () => {
    const result = resolveStyles({
      document: document([paragraph([text("Hello")])]),
      config: cloneConfig()
    });
    const resolved = result.document.children[0];

    expect(resolved?.source?.file).toBe("input.md");
    expect(resolved?.path).toEqual([
      { type: "root", name: "document" },
      { type: "field", name: "children" },
      { type: "index", index: 0 }
    ]);
    expect(result.document.children[0]?.kind).toBe("paragraph");
  });
});
