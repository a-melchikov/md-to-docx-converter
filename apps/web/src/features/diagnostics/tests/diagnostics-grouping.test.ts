import {
  createDiagnostic,
  diagnosticCode,
  documentPathField,
  documentPathRoot
} from "@md-to-docx/domain";
import { describe, expect, it } from "vitest";

import {
  buildDiagnosticViewModels,
  filterDiagnostics,
  groupDiagnostics,
  summarizeDiagnostics
} from "../diagnostics-grouping.js";

describe("diagnostics grouping", () => {
  it("groups diagnostics by severity and category", () => {
    const items = buildDiagnosticViewModels([
      {
        source: "config",
        diagnostics: [
          createDiagnostic({
            severity: "error",
            code: "config.validation.required",
            message: "Поле обязательно.",
            path: [documentPathField("version")]
          })
        ]
      },
      {
        source: "preview",
        diagnostics: [
          createDiagnostic({
            severity: "warning",
            code: "markdown.unsupportedHtml",
            message: "HTML был пропущен.",
            path: [documentPathRoot(), documentPathField("children")]
          }),
          createDiagnostic({
            severity: "info",
            code: diagnosticCode("frontend.upload.validation"),
            message: "Файл проверен."
          })
        ]
      }
    ]);
    const groups = groupDiagnostics(items);

    expect(groups.map((group) => group.severity)).toEqual([
      "error",
      "warning",
      "info"
    ]);
    expect(groups[0]?.categories[0]?.category).toBe("Настройки");
    expect(groups[1]?.categories[0]?.category).toBe("Markdown");
    expect(groups[2]?.categories[0]?.category).toBe("Файлы");
  });

  it("summarizes diagnostics by severity", () => {
    const items = buildDiagnosticViewModels([
      {
        source: "api",
        diagnostics: [
          createDiagnostic({
            severity: "error",
            code: diagnosticCode("api.preview.pipelineFailed"),
            message: "Ошибка API."
          }),
          createDiagnostic({
            severity: "warning",
            code: "preview.fidelity.fastMode",
            message: "Быстрый режим."
          })
        ]
      }
    ]);

    expect(summarizeDiagnostics(items)).toEqual({
      error: 1,
      warning: 1,
      info: 0,
      total: 2
    });
  });

  it("filters diagnostics by severity", () => {
    const items = buildDiagnosticViewModels([
      {
        source: "export",
        diagnostics: [
          createDiagnostic({
            severity: "error",
            code: diagnosticCode("api.export.network"),
            message: "Сервер недоступен."
          }),
          createDiagnostic({
            severity: "warning",
            code: "docx.image.missingAsset",
            message: "Нет изображения."
          })
        ]
      }
    ]);

    expect(filterDiagnostics(items, "error")).toHaveLength(1);
    expect(filterDiagnostics(items, "warning")).toHaveLength(1);
    expect(filterDiagnostics(items, "info")).toHaveLength(0);
    expect(filterDiagnostics(items, "all")).toHaveLength(2);
  });
});
