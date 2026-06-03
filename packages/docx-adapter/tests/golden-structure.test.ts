import { describe, expect, it } from "vitest";
import JSZip from "jszip";

import { generateDocx } from "../src/index.js";
import { fixtureDocument, png1x1 } from "./fixtures.js";

describe("DOCX golden structure", () => {
  it("creates expected DOCX package parts and content", async () => {
    const result = await generateDocx({
      document: fixtureDocument(),
      assets: {
        "image-1": {
          data: png1x1,
          format: "png",
          contentType: "image/png"
        }
      }
    });
    const zip = await JSZip.loadAsync(result.buffer);
    const documentXml = await requiredText(zip, "word/document.xml");
    const relsXml = await requiredText(zip, "word/_rels/document.xml.rels");
    const numberingXml = await requiredText(zip, "word/numbering.xml");

    expect(zip.file("[Content_Types].xml")).toBeTruthy();
    expect(zip.file("_rels/.rels")).toBeTruthy();
    expect(zip.file("word/document.xml")).toBeTruthy();
    expect(zip.file("word/_rels/document.xml.rels")).toBeTruthy();
    expect(zip.file("word/styles.xml")).toBeTruthy();
    expect(zip.file("word/numbering.xml")).toBeTruthy();
    expect(Object.keys(zip.files).some((path) => path.startsWith("word/media/"))).toBe(
      true
    );

    expect(documentXml).toContain("Simple paragraph");
    expect(documentXml).toContain("Heading 1");
    expect(documentXml).toContain("Header cell");
    expect(documentXml).toContain("Body cell");
    expect(documentXml).toContain("const value = 1;");
    expect(documentXml).toContain("Bullet item");
    expect(documentXml).toContain("Ordered item");
    expect(documentXml).toContain("Nested item");
    expect(documentXml).toContain("Quote text");
    expect(relsXml).toContain("hyperlink");
    expect(relsXml).toContain("https://example.com");
    expect(numberingXml).toContain("abstractNum");
  });
});

const requiredText = async (zip: JSZip, path: string): Promise<string> => {
  const file = zip.file(path);

  if (file === null) {
    throw new Error(`Missing DOCX package part: ${path}`);
  }

  return file.async("text");
};
