export type MarkdownProfile = "commonmark" | "commonmark-gfm";

export type UnsupportedNodePolicy = "warn-and-skip" | "fallback-text" | "error";

export type HtmlPolicy = UnsupportedNodePolicy;

export interface MarkdownParserOptions {
  readonly markdownProfile?: MarkdownProfile;
  readonly htmlPolicy?: HtmlPolicy;
  readonly onUnsupportedNode?: UnsupportedNodePolicy;
}

export interface ResolvedMarkdownParserOptions {
  readonly markdownProfile: MarkdownProfile;
  readonly htmlPolicy: HtmlPolicy;
  readonly onUnsupportedNode: UnsupportedNodePolicy;
}

export const resolveMarkdownParserOptions = (
  options: MarkdownParserOptions = {}
): ResolvedMarkdownParserOptions => ({
  markdownProfile: options.markdownProfile ?? "commonmark-gfm",
  htmlPolicy: options.htmlPolicy ?? "warn-and-skip",
  onUnsupportedNode: options.onUnsupportedNode ?? "warn-and-skip"
});
