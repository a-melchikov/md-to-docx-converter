import { describe, expect, it } from "vitest";

import { resolveStyles } from "../src/index.js";
import { cloneConfig, document, paragraph, path, source, text } from "./helpers.js";

describe("XML sanitizer", () => {
  it("warn-and-skip removes invalid XML characters", () => {
    const config = cloneConfig();
    config.input.onInvalidXmlChar = "warn-and-skip";
    const result = resolveStyles({
      document: document([paragraph([text(`a${String.fromCharCode(8)}b`)])]),
      config
    });
    const resolved = result.document.children[0];
    const value =
      resolved?.kind === "paragraph" && resolved.children[0]?.kind === "text"
        ? resolved.children[0].value
        : undefined;

    expect(value).toBe("ab");
    expect(result.diagnostics[0]).toEqual(
      expect.objectContaining({
        severity: "warning",
        code: "style.invalidXmlCharacter"
      })
    );
  });

  it("error removes invalid XML characters and reports an error diagnostic", () => {
    const config = cloneConfig();
    config.input.onInvalidXmlChar = "error";
    const result = resolveStyles({
      document: document([paragraph([text(`a${String.fromCharCode(8)}b`)])]),
      config
    });
    const resolved = result.document.children[0];
    const value =
      resolved?.kind === "paragraph" && resolved.children[0]?.kind === "text"
        ? resolved.children[0].value
        : undefined;

    expect(value).toBe("ab");
    expect(result.diagnostics[0]).toEqual(
      expect.objectContaining({
        severity: "error",
        code: "style.invalidXmlCharacter"
      })
    );
  });

  it("replace-uFFFD replaces invalid XML characters", () => {
    const config = cloneConfig();
    config.input.onInvalidXmlChar = "replace-uFFFD";
    const result = resolveStyles({
      document: document([paragraph([text(`a${String.fromCharCode(8)}b`)])]),
      config
    });
    const resolved = result.document.children[0];
    const value =
      resolved?.kind === "paragraph" && resolved.children[0]?.kind === "text"
        ? resolved.children[0].value
        : undefined;

    expect(value).toBe("a\uFFFDb");
    expect(result.diagnostics[0]?.severity).toBe("warning");
  });

  it("preserves source and path on XML diagnostics", () => {
    const config = cloneConfig();
    const result = resolveStyles({
      document: document([paragraph([text(`a${String.fromCharCode(8)}b`)])]),
      config
    });

    expect(result.diagnostics[0]?.source).toEqual(source);
    expect(result.diagnostics[0]?.path).toEqual([
      ...path(0),
      { type: "field", name: "children" },
      { type: "index", index: 0 }
    ]);
  });
});
