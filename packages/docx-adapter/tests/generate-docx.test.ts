import { describe, expect, it } from "vitest";
import JSZip from "jszip";

import type { Diagnostic, ResolvedBlockNode } from "@md-to-docx/domain";
import { halfPoint } from "@md-to-docx/domain";

import { DOCX_CONTENT_TYPE, generateDocx } from "../src/index.js";
import {
  baseStyle,
  fixtureDocument,
  paragraphNode,
  png1x1,
  resolvedDocument,
  textNode
} from "./fixtures.js";

describe("generateDocx", () => {
  it("generates an empty document", async () => {
    const result = await generateDocx(resolvedDocument([]));

    expect(result.buffer.byteLength).toBeGreaterThan(0);
    expect(result.contentType).toBe(DOCX_CONTENT_TYPE);
    expect(result.fileName).toBe("document.docx");
    expect(result.diagnostics).toEqual([]);
  });

  it("generates MVP elements without adapter diagnostics", async () => {
    const result = await generateDocx({
      document: fixtureDocument(),
      options: { fileName: "fixture" },
      assets: {
        "image-1": {
          data: png1x1,
          format: "png",
          contentType: "image/png"
        }
      }
    });

    expect(result.buffer.byteLength).toBeGreaterThan(0);
    expect(result.fileName).toBe("fixture.docx");
    expect(result.diagnostics).toEqual([]);
  });

  it("generates headings h1-h6", async () => {
    const result = await generateDocx(
      resolvedDocument(
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
    );
    const zip = await JSZip.loadAsync(result.buffer);
    const documentXml = await zip.file("word/document.xml")?.async("text");

    expect(documentXml).toContain("Heading 1");
    expect(documentXml).toContain("Heading 6");
  });

  it("passes through incoming diagnostics", async () => {
    const diagnostic: Diagnostic = {
      severity: "warning",
      code: "style.fallback",
      message: "Existing diagnostic"
    };
    const result = await generateDocx({
      ...resolvedDocument([paragraphNode([textNode("Diagnostics")])], [diagnostic])
    });

    expect(result.diagnostics).toContainEqual(diagnostic);
  });

  it("adds a warning and alt text fallback for missing image asset", async () => {
    const imageBlock: ResolvedBlockNode = {
      kind: "image-block",
      sourceKind: "image-block",
      src: "diagram.png",
      assetId: "missing",
      alt: "Diagram alt",
      style: { image: { preserveAspectRatio: true } }
    };
    const result = await generateDocx(resolvedDocument([imageBlock]));

    expect(result.buffer.byteLength).toBeGreaterThan(0);
    expect(result.diagnostics[0]).toEqual(
      expect.objectContaining({
        severity: "warning",
        code: "docx.image.missingAsset"
      })
    );
  });

  it("adds a diagnostic for unsupported nodes", async () => {
    const unsupported: ResolvedBlockNode = {
      kind: "unsupported-block",
      sourceKind: "unsupported-block",
      originalType: "footnoteDefinition",
      fallbackText: "Footnote fallback",
      style: baseStyle
    };
    const result = await generateDocx(resolvedDocument([unsupported]));

    expect(result.diagnostics[0]?.code).toBe("docx.node.unsupported");
  });

  it("adds style fallback diagnostics for partial style", async () => {
    const result = await generateDocx(
      resolvedDocument([paragraphNode([textNode("Partial", {})], {})])
    );

    expect(
      result.diagnostics.some(
        (diagnostic) => diagnostic.code === "docx.style.fallback"
      )
    ).toBe(true);
  });

  it("supports data URI images", async () => {
    const data = Buffer.from(png1x1).toString("base64");
    const imageBlock: ResolvedBlockNode = {
      kind: "image-block",
      sourceKind: "image-block",
      src: `data:image/png;base64,${data}`,
      alt: "Data URI image",
      style: { image: { maxWidthEmu: 914400 } }
    };
    const result = await generateDocx(resolvedDocument([imageBlock]));

    expect(result.buffer.byteLength).toBeGreaterThan(0);
    expect(result.diagnostics).toEqual([]);
  });

  it("maps inline run styling", async () => {
    const result = await generateDocx(
      resolvedDocument([
        paragraphNode([
          {
            kind: "inline-code",
            sourceKind: "inline-code",
            value: "code",
            style: {
              run: {
                font: { ascii: "Courier New" },
                sizeHalfPt: halfPoint(20)
              }
            }
          }
        ])
      ])
    );

    expect(result.buffer.byteLength).toBeGreaterThan(0);
  });
});
