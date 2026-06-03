import { describe, expect, it } from "vitest";

import type { HeadingNode, TextNode } from "../src/index.js";
import { isBlockNode, isInlineNode } from "../src/index.js";

describe("document model guards", () => {
  it("recognizes block nodes by kind", () => {
    const node: HeadingNode = {
      kind: "heading",
      level: 1,
      children: [{ kind: "text", value: "Title" }]
    };

    expect(isBlockNode(node)).toBe(true);
    expect(isInlineNode(node)).toBe(false);
  });

  it("recognizes inline nodes by kind", () => {
    const node: TextNode = {
      kind: "text",
      value: "Text"
    };

    expect(isInlineNode(node)).toBe(true);
    expect(isBlockNode(node)).toBe(false);
  });

  it("rejects unknown or malformed values", () => {
    expect(isBlockNode({ kind: "unknown" })).toBe(false);
    expect(isInlineNode({ kind: "unknown" })).toBe(false);
    expect(isBlockNode(null)).toBe(false);
    expect(isInlineNode("text")).toBe(false);
  });
});
