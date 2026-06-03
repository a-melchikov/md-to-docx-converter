import type { Diagnostic, DocumentNode } from "@md-to-docx/domain";
import type { Root } from "mdast";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";

import { createMarkdownDiagnostic } from "./diagnostics.js";
import { mdastToDocument } from "./mdast-to-document.js";
import type { MarkdownParserOptions } from "./options.js";
import { resolveMarkdownParserOptions } from "./options.js";
import { rootPath } from "./source-mapping.js";

export interface ParseMarkdownInput {
  readonly markdown: string;
  readonly fileName?: string;
  readonly options?: MarkdownParserOptions;
}

export interface ParseMarkdownResult {
  readonly document: DocumentNode;
  readonly diagnostics: readonly Diagnostic[];
}

export const parseMarkdown = (
  input: ParseMarkdownInput
): ParseMarkdownResult => {
  const options = resolveMarkdownParserOptions(input.options);
  const path = rootPath();

  if (typeof input.markdown !== "string") {
    return {
      document: emptyDocument(path),
      diagnostics: [
        createMarkdownDiagnostic({
          severity: "error",
          code: "markdown.invalidInput",
          message: "Markdown должен быть строкой.",
          path
        })
      ]
    };
  }

  try {
    const processor =
      options.markdownProfile === "commonmark-gfm"
        ? unified().use(remarkParse).use(remarkGfm)
        : unified().use(remarkParse);
    const tree = processor.parse(input.markdown) as Root;
    const result = mdastToDocument({
      tree,
      options,
      ...(input.fileName === undefined ? {} : { fileName: input.fileName })
    });

    return result;
  } catch (error) {
    return {
      document: emptyDocument(path),
      diagnostics: [
        createMarkdownDiagnostic({
          severity: "error",
          code: "markdown.parseError",
          message: "Markdown не удалось разобрать.",
          path,
          metadata: {
            error:
              error instanceof Error
                ? error.message
                : "Unknown Markdown parse error"
          }
        })
      ]
    };
  }
};

const emptyDocument = (path = rootPath()): DocumentNode => ({
  kind: "document",
  children: [],
  path
});
