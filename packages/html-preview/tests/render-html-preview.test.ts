import { describe, expect, it } from "vitest";

import type {
  ResolvedBlockNode,
  ResolvedDocument,
  ResolvedInlineNode
} from "@md-to-docx/domain";
import { twip } from "@md-to-docx/domain";

import { renderHtmlPreview } from "../src/index.js";
import {
  baseStyle,
  codeStyle,
  fixtureDocument,
  paragraphNode,
  resolvedDocument,
  textNode
} from "./fixtures.js";

describe("renderHtmlPreview", () => {
  it("renders an empty document with page boxes", () => {
    const result = renderHtmlPreview({ document: resolvedDocument([]) });

    expect(result.html).toContain("md2docx-preview");
    expect(result.html).toContain("md2docx-page");
    expect(result.html).toContain("md2docx-page-content");
    expect(result.metadata.fidelity).toBe("fast-preview");
  });

  it("renders MVP document elements", () => {
    const result = renderHtmlPreview({ document: fixtureDocument() });

    expect(result.html).toContain("Simple paragraph");
    expect(result.html).toContain("Heading 1");
    expect(result.html).toContain("<strong");
    expect(result.html).toContain("<em");
    expect(result.html).toContain("md2docx-inline-code");
    expect(result.html).toContain("const value = 1;");
    expect(result.html).toContain("md2docx-blockquote");
    expect(result.html).toContain("Bullet item");
    expect(result.html).toContain("Ordered item");
    expect(result.html).toContain("Nested item");
    expect(result.html).toContain("md2docx-table");
    expect(result.html).toContain("Header cell");
    expect(result.html).toContain("Body cell");
    expect(result.html).toContain("md2docx-image");
    expect(result.html).toContain("md2docx-thematic-break");
  });

  it("renders headings h1-h6", () => {
    const result = renderHtmlPreview({
      document: resolvedDocument(
        [1, 2, 3, 4, 5, 6].map(
          (level) =>
            ({
              kind: "heading",
              sourceKind: "heading",
              level,
              style: baseStyle,
              children: [textNode(`Heading ${level}`)]
            }) as ResolvedBlockNode
        )
      )
    });

    expect(result.html).toContain("<h1");
    expect(result.html).toContain("<h6");
    expect(result.html).toContain("Heading 6");
  });

  it("renders safe links and blocks unsafe URLs", () => {
    const unsafeLink: ResolvedInlineNode = {
      kind: "link",
      sourceKind: "link",
      href: "javascript:alert(1)",
      style: baseStyle,
      children: [textNode("Unsafe")]
    };
    const result = renderHtmlPreview({
      document: resolvedDocument([
        paragraphNode([
          {
            kind: "link",
            sourceKind: "link",
            href: "mailto:test@example.com",
            style: baseStyle,
            children: [textNode("Mail")]
          },
          unsafeLink
        ])
      ])
    });

    expect(result.html).toContain("href=\"mailto:test@example.com\"");
    expect(result.html).not.toContain("javascript:alert");
    expect(
      result.diagnostics.some(
        (diagnostic) => diagnostic.code === "preview.security.unsafeUrl"
      )
    ).toBe(true);
  });

  it("renders image fallback when source is missing", () => {
    const image: ResolvedBlockNode = {
      kind: "image-block",
      sourceKind: "image-block",
      src: "",
      alt: "Missing image",
      style: {}
    };
    const result = renderHtmlPreview({ document: resolvedDocument([image]) });

    expect(result.html).toContain("md2docx-image-placeholder");
    expect(result.html).toContain("Missing image");
  });

  it("renders page margins and zoom variables", () => {
    const result = renderHtmlPreview({
      document: resolvedDocument([paragraphNode([textNode("Zoom")])]),
      options: { zoom: 1.25, pageMode: "single" }
    });

    expect(result.html).toContain("--preview-zoom: 1.25");
    expect(result.html).toContain("--margin-top: 96px");
    expect(result.html).toContain("--content-width: 601.733px");
    expect(result.html).toContain("--content-height: 930.533px");
    expect(result.html).toContain("data-page-mode=\"single\"");
  });

  it("uses a fixed page content box for Word-like margins", () => {
    const result = renderHtmlPreview({
      document: resolvedDocument([paragraphNode([textNode("Box model")])])
    });

    expect(result.css).toContain(".md2docx-page-content");
    expect(result.css).toContain("box-sizing: border-box");
    expect(result.css).toContain("width: 100%");
    expect(result.css).toContain("height: 100%");
    expect(result.css).toContain(
      "padding: var(--margin-top) var(--margin-right) var(--margin-bottom) var(--margin-left)"
    );
  });

  it("maps auto and exact line spacing differently", () => {
    const exactStyle = {
      ...baseStyle,
      paragraph: {
        ...baseStyle.paragraph,
        spacing: { ...baseStyle.paragraph?.spacing, lineTwip: twip(240), lineRule: "exact" as const }
      }
    };
    const result = renderHtmlPreview({
      document: resolvedDocument([
        paragraphNode([textNode("Auto line")], baseStyle),
        paragraphNode([textNode("Exact line")], exactStyle)
      ])
    });

    expect(result.html).toContain("line-height: 1.15");
    expect(result.html).toContain("line-height: 16px");
  });

  it("splits a long document into multiple approximate pages", () => {
    const result = renderHtmlPreview({
      document: resolvedDocument(
        Array.from({ length: 90 }, (_value, index) =>
          paragraphNode([textNode(`Paragraph ${index + 1} with enough text for preview pagination.`)])
        )
      )
    });

    expect(countOccurrences(result.html, "md2docx-page")).toBeGreaterThan(1);
    expect(result.metadata.pageCountApproximation).toBeGreaterThan(1);
    expect(
      result.diagnostics.some(
        (diagnostic) => diagnostic.code === "preview.fidelity.pageBreakApproximation"
      )
    ).toBe(true);
  });

  it("uses margins when estimating page count", () => {
    const blocks = Array.from({ length: 70 }, (_value, index) =>
      paragraphNode([
        textNode(`Paragraph ${index + 1} with enough text to make margin changes affect pagination.`)
      ])
    );
    const normalMargins = renderHtmlPreview({
      document: resolvedDocument(blocks)
    });
    const largeMargins = renderHtmlPreview({
      document: withPageMargins(resolvedDocument(blocks), 2400)
    });

    expect(largeMargins.metadata.pageCountApproximation).toBeGreaterThanOrEqual(
      normalMargins.metadata.pageCountApproximation ?? 1
    );
  });

  it("starts a new page when a block requests pageBreakBefore", () => {
    const result = renderHtmlPreview({
      document: resolvedDocument([
        paragraphNode([textNode("First page")]),
        paragraphNode([textNode("Second page")], {
          ...baseStyle,
          paragraph: {
            ...baseStyle.paragraph,
            pageBreakBefore: true
          }
        })
      ])
    });

    expect(countOccurrences(result.html, "md2docx-page")).toBe(2);
    expect(result.metadata.pageCountApproximation).toBe(2);
  });

  it("renders custom page fallback diagnostic", () => {
    const document = {
      ...resolvedDocument([paragraphNode([textNode("Custom")])]),
      properties: {
        ...resolvedDocument([]).properties,
        page: {
          size: { preset: "custom", orientation: "portrait" },
          margin: {
            topTwip: twip(1440),
            rightTwip: twip(1440),
            bottomTwip: twip(1440),
            leftTwip: twip(1440)
          }
        }
      }
    };
    const result = renderHtmlPreview({ document });

    expect(
      result.diagnostics.some(
        (diagnostic) => diagnostic.code === "preview.style.fallback"
      )
    ).toBe(true);
  });

  it("escapes user text and code", () => {
    const result = renderHtmlPreview({
      document: resolvedDocument([
        paragraphNode([textNode("<script>alert(1)</script>")]),
        {
          kind: "code-block",
          sourceKind: "code-block",
          style: codeStyle,
          value: "<b>code</b>"
        }
      ])
    });

    expect(result.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(result.html).toContain("&lt;b&gt;code&lt;/b&gt;");
    expect(
      result.diagnostics.some(
        (diagnostic) => diagnostic.code === "preview.security.escapedHtml"
      )
    ).toBe(true);
  });

  it("reports unsupported nodes and fidelity warnings", () => {
    const unsupported: ResolvedBlockNode = {
      kind: "unsupported-block",
      sourceKind: "unsupported-block",
      originalType: "footnoteDefinition",
      fallbackText: "Footnote",
      style: {}
    };
    const result = renderHtmlPreview({
      document: resolvedDocument([
        paragraphNode([textNode("Keep")], {
          paragraph: { keepNext: true, pageBreakBefore: true },
          run: baseStyle.run
        }),
        unsupported
      ])
    });

    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(
      expect.arrayContaining([
        "preview.fidelity.fastMode",
        "preview.fidelity.pageBreakApproximation",
        "preview.fidelity.unsupportedProperty",
        "preview.node.unsupported"
      ])
    );
  });

  it("embeds css when requested", () => {
    const result = renderHtmlPreview({
      document: resolvedDocument([]),
      options: { includeCss: true }
    });

    expect(result.html.startsWith("<style>")).toBe(true);
    expect(result.css).toContain(".md2docx-page");
  });
});

function countOccurrences(value: string, pattern: string): number {
  if (pattern === "md2docx-page") {
    return value.match(/class="md2docx-page"/gu)?.length ?? 0;
  }

  return value.split(pattern).length - 1;
}

function withPageMargins(
  document: ResolvedDocument,
  marginTwip: number
): ResolvedDocument {
  return {
    ...document,
    properties: {
      ...document.properties,
      page: {
        ...document.properties.page,
        margin: {
          topTwip: twip(marginTwip),
          rightTwip: twip(marginTwip),
          bottomTwip: twip(marginTwip),
          leftTwip: twip(marginTwip)
        }
      }
    }
  };
}
