import type { BlockNode, InlineNode } from "./document-model.js";

const blockNodeKinds = new Set<string>([
  "paragraph",
  "heading",
  "blockquote",
  "unordered-list",
  "ordered-list",
  "list-item",
  "code-block",
  "thematic-break",
  "table",
  "table-row",
  "table-cell",
  "image-block",
  "unsupported-block"
]);

const inlineNodeKinds = new Set<string>([
  "text",
  "strong",
  "emphasis",
  "strikethrough",
  "inline-code",
  "link",
  "inline-image",
  "hard-break",
  "soft-break",
  "unsupported-inline"
]);

export const isBlockNode = (value: unknown): value is BlockNode =>
  hasKnownKind(value, blockNodeKinds);

export const isInlineNode = (value: unknown): value is InlineNode =>
  hasKnownKind(value, inlineNodeKinds);

const hasKnownKind = (value: unknown, kinds: ReadonlySet<string>): boolean =>
  typeof value === "object" &&
  value !== null &&
  "kind" in value &&
  typeof value.kind === "string" &&
  kinds.has(value.kind);
