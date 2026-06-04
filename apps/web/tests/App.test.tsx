import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "../src/App.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("frontend shell", () => {
  it("renders the application shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "MD → DOCX" })).toBeInTheDocument();
    expect(
      screen.getByText("Конвертация Markdown в DOCX")
    ).toBeInTheDocument();
  });

  it("renders the four primary UI zones", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Редактор Markdown" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Предпросмотр DOCX" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Настройки" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Предупреждения и ошибки" })
    ).toBeInTheDocument();
  });

  it("provides an accessible editor textarea", () => {
    render(<App />);

    const editor = screen.getByRole("textbox", {
      name: "Markdown-текст"
    }) as HTMLTextAreaElement;

    expect(editor.value).toContain("# Заголовок документа");
  });

  it("renders toolbar actions with accessible names", () => {
    render(<App />);

    for (const name of [
      "Открыть Markdown",
      "Импорт настроек",
      "Экспорт настроек"
    ]) {
      expect(screen.getByRole("button", { name })).toBeDisabled();
    }
    expect(screen.getByRole("button", { name: "Скачать DOCX" })).toBeEnabled();
  });

  it("renders settings tabs as keyboard-accessible buttons", () => {
    render(<App />);
    const tabList = screen.getByRole("tablist", { name: "Разделы настроек" });

    for (const name of [
      "Документ",
      "Заголовки",
      "Обычный текст",
      "Код",
      "Списки",
      "Таблицы"
    ]) {
      expect(within(tabList).getByRole("tab", { name })).toBeInTheDocument();
    }
  });

  it("renders the warnings empty state", () => {
    render(<App />);

    expect(screen.getAllByText("Документ готов к экспорту.").length).toBeGreaterThan(0);
  });

  it("uses semantic layout regions", () => {
    render(<App />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(
      screen.getByRole("main", { name: "Рабочая область конвертации" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Действия с документом" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("complementary", { name: "Панель ввода и настроек" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("complementary", { name: "Предупреждения и ошибки" })
    ).toBeInTheDocument();
  });

  it("renders an accessible live preview region", () => {
    render(<App />);

    expect(
      screen.getByRole("region", { name: "HTML предпросмотр документа" })
    ).toBeInTheDocument();
  });

  it("keeps DOCX export available while editing Markdown", () => {
    render(<App />);

    fireEvent.change(screen.getByRole("textbox", { name: "Markdown-текст" }), {
      target: { value: "# Новый документ" }
    });

    expect(screen.getByRole("button", { name: "Скачать DOCX" })).toBeEnabled();
  });

  it("updates application Markdown state from uploaded file", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Выбрать Markdown-файл"), {
      target: {
        files: [markdownFile("uploaded.md", "# Загруженный документ")]
      }
    });

    await waitFor(() => {
      expect(
        screen.getByRole("textbox", { name: "Markdown-текст" })
      ).toHaveValue("# Загруженный документ");
    });
    expect(screen.getByText("Файл: uploaded.md")).toBeInTheDocument();
  });

  it("uses a light document workspace layout with collapsible controls", () => {
    render(<App />);

    expect(screen.getByText("Рабочее пространство")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Скрыть панель ввода" })[0]
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getAllByRole("button", { name: "Скрыть предупреждения" })[0]
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("heading", { name: "Предпросмотр DOCX" })
    ).toBeInTheDocument();
  });

  it("keeps Markdown state when the input and configuration panel is hidden", () => {
    render(<App />);

    fireEvent.change(screen.getByRole("textbox", { name: "Markdown-текст" }), {
      target: { value: "# Текст сохраняется" }
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Скрыть панель ввода" })[0]!);

    expect(screen.queryByRole("textbox", { name: "Markdown-текст" })).toBeNull();
    expect(
      screen.getByRole("region", { name: "HTML предпросмотр документа" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Показать панель ввода" })[0]!);

    expect(screen.getByRole("textbox", { name: "Markdown-текст" })).toHaveValue(
      "# Текст сохраняется"
    );
  });

  it("shows a compact indicator when warnings are hidden and diagnostics exist", async () => {
    const invalidFile = new File(["%PDF"], "document.pdf", {
      type: "application/pdf"
    });
    Object.defineProperty(invalidFile, "text", {
      value: () => Promise.resolve("%PDF")
    });
    render(<App />);

    fireEvent.change(screen.getByLabelText("Выбрать Markdown-файл"), {
      target: {
        files: [invalidFile]
      }
    });

    expect(
      (
        await screen.findAllByText(
          "Формат файла не поддерживается. Разрешены: .md, .markdown, .txt."
        )
      ).length
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: "Скрыть предупреждения" })[0]!);

    expect(screen.getAllByText("1 ошибка").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: "Показать предупреждения" })[0]
    ).toHaveAttribute("aria-expanded", "false");
  });
});

function markdownFile(name: string, content: string): File {
  const file = new File([content], name, { type: "text/markdown" });
  Object.defineProperty(file, "text", {
    value: () => Promise.resolve(content)
  });
  return file;
}
