import {
  createDiagnostic,
  diagnosticCode,
  documentPathField
} from "@md-to-docx/domain";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DiagnosticsPanel } from "../DiagnosticsPanel.js";
import type { DiagnosticSourceInput } from "../diagnostics-source.js";

describe("DiagnosticsPanel", () => {
  it("renders empty state", () => {
    render(<DiagnosticsPanel sources={[]} />);

    expect(screen.getByText("Ошибок и предупреждений нет")).toBeInTheDocument();
  });

  it("renders severity labels as text", () => {
    render(<DiagnosticsPanel sources={diagnosticSources()} />);

    expect(screen.getAllByText("Ошибка").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Предупреждение").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Информация").length).toBeGreaterThan(0);
  });

  it("groups diagnostics by severity and category", () => {
    render(<DiagnosticsPanel sources={diagnosticSources()} />);

    expect(screen.getByRole("heading", { name: "Ошибки" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Предупреждения" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Информация" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Конфигурация" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Markdown" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Предпросмотр" })).toBeInTheDocument();
  });

  it("shows summary counts", () => {
    render(<DiagnosticsPanel sources={diagnosticSources()} />);

    expect(screen.getByText("Ошибки: 1")).toBeInTheDocument();
    expect(screen.getByText("Предупреждения: 2")).toBeInTheDocument();
    expect(screen.getByText("Информация: 1")).toBeInTheDocument();
  });

  it("filters by errors", () => {
    render(<DiagnosticsPanel sources={diagnosticSources()} />);

    fireEvent.click(screen.getByRole("button", { name: "Ошибки" }));

    expect(screen.getByText("Поле \"version\" обязательно.")).toBeInTheDocument();
    expect(screen.queryByText("HTML был пропущен.")).not.toBeInTheDocument();
  });

  it("filters by warnings", () => {
    render(<DiagnosticsPanel sources={diagnosticSources()} />);

    fireEvent.click(screen.getByRole("button", { name: "Предупреждения" }));

    expect(screen.getByText("HTML был пропущен.")).toBeInTheDocument();
    expect(screen.getByText("Быстрый предпросмотр.")).toBeInTheDocument();
    expect(screen.queryByText("Поле \"version\" обязательно.")).not.toBeInTheDocument();
  });

  it("filters by info", () => {
    render(<DiagnosticsPanel sources={diagnosticSources()} />);

    fireEvent.click(screen.getByRole("button", { name: "Информация" }));

    expect(screen.getByText("Файл загружен.")).toBeInTheDocument();
    expect(screen.queryByText("HTML был пропущен.")).not.toBeInTheDocument();
  });

  it("shows path, source location and technical details", () => {
    render(<DiagnosticsPanel sources={diagnosticSources()} />);

    expect(screen.getAllByText("Путь: version").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Строка 12, столбец 5").length).toBeGreaterThan(0);

    const details = screen.getAllByText("Технические детали")[0];
    fireEvent.click(details);

    expect(screen.getAllByText("Код").length).toBeGreaterThan(0);
    expect(screen.getByText("config.validation.required")).toBeInTheDocument();
  });

  it("shows metadata only inside technical details", () => {
    const { container } = render(<DiagnosticsPanel sources={diagnosticSources()} />);

    fireEvent.click(screen.getAllByText("Технические детали")[1]);

    const metadataBlocks = container.querySelectorAll(
      ".diagnostics-technical-details pre"
    );
    expect(metadataBlocks).toHaveLength(1);
    expect(metadataBlocks[0]?.textContent).toContain("\"limit\": 500000");
  });

  it("has accessible filter controls", () => {
    render(<DiagnosticsPanel sources={diagnosticSources()} />);

    const filters = screen.getByRole("group", { name: "Фильтр diagnostics" });

    for (const name of ["Все", "Ошибки", "Предупреждения", "Информация"]) {
      expect(within(filters).getByRole("button", { name })).toBeInTheDocument();
    }
  });
});

function diagnosticSources(): readonly DiagnosticSourceInput[] {
  return [
    {
      source: "config",
      diagnostics: [
        createDiagnostic({
          severity: "error",
          code: "config.validation.required",
          message: "Поле \"version\" обязательно.",
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
          source: {
            start: {
              line: 12,
              column: 5
            }
          },
          metadata: {
            limit: 500000
          }
        }),
        createDiagnostic({
          severity: "warning",
          code: "preview.fidelity.fastMode",
          message: "Быстрый предпросмотр."
        })
      ]
    },
    {
      source: "frontend",
      diagnostics: [
        createDiagnostic({
          severity: "info",
          code: diagnosticCode("frontend.upload.completed"),
          message: "Файл загружен."
        })
      ]
    }
  ];
}
