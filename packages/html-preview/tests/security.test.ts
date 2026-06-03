import { describe, expect, it } from "vitest";

import type { Diagnostic } from "@md-to-docx/domain";

import { escapeHtml, safeHref } from "../src/security.js";

const context = (): {
  readonly diagnostics: Diagnostic[];
  fastModeDiagnosticAdded: boolean;
} => ({
  diagnostics: [],
  fastModeDiagnosticAdded: false
});

describe("security helpers", () => {
  it("escapes HTML-sensitive characters", () => {
    const renderContext = context();
    const escaped = escapeHtml({ value: "<b>\"x\"</b>", context: renderContext });

    expect(escaped).toBe("&lt;b&gt;&quot;x&quot;&lt;/b&gt;");
    expect(renderContext.diagnostics[0]?.code).toBe("preview.security.escapedHtml");
  });

  it("allows safe URLs and blocks unsafe protocols", () => {
    const renderContext = context();

    expect(safeHref("https://example.com", renderContext)).toBe(
      "https://example.com"
    );
    expect(safeHref("/relative/path", renderContext)).toBe("/relative/path");
    expect(safeHref("javascript:alert(1)", renderContext)).toBeUndefined();
    expect(
      renderContext.diagnostics.some(
        (diagnostic) => diagnostic.code === "preview.security.unsafeUrl"
      )
    ).toBe(true);
  });
});
