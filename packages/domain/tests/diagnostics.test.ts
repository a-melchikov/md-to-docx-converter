import { describe, expect, it } from "vitest";

import {
  createDiagnostic,
  diagnosticCode,
  documentPathField,
  documentPathIndex,
  documentPathRoot,
  isDiagnostic,
  pathToString
} from "../src/index.js";

describe("diagnostics", () => {
  it("creates diagnostics with optional source, path, and metadata", () => {
    const diagnostic = createDiagnostic({
      severity: "warning",
      code: "unsupported-markdown-node",
      message: "Unsupported Markdown node.",
      source: {
        file: "input.md",
        start: { line: 1, column: 2, offset: 3 },
        length: 4
      },
      path: [
        documentPathRoot(),
        documentPathField("children"),
        documentPathIndex(3)
      ],
      metadata: {
        originalType: "html",
        skipped: true
      }
    });

    expect(isDiagnostic(diagnostic)).toBe(true);
    expect(pathToString(diagnostic.path ?? [])).toBe("document.children[3]");
  });

  it("supports custom diagnostic codes through a factory", () => {
    const diagnostic = createDiagnostic({
      severity: "info",
      code: diagnosticCode("custom-warning"),
      message: "Custom warning."
    });

    expect(isDiagnostic(diagnostic)).toBe(true);
    expect(diagnostic.code).toBe("custom-warning");
  });

  it("rejects empty custom diagnostic codes", () => {
    expect(() => diagnosticCode(" ")).toThrow(RangeError);
  });

  it("recognizes invalid diagnostic-like values", () => {
    expect(isDiagnostic({ severity: "fatal", code: "x", message: "x" })).toBe(
      false
    );
    expect(isDiagnostic({ severity: "warning", code: "", message: "x" })).toBe(
      false
    );
    expect(
      isDiagnostic({
        severity: "warning",
        code: "asset-warning",
        message: "x",
        metadata: { nested: { unsafe: true } }
      })
    ).toBe(false);
  });
});
