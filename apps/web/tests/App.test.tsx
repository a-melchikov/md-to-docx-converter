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
      screen.getByRole("heading", { name: "Предпросмотр" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Настройки" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Предупреждения" })
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
      "Экспорт настроек",
      "Скачать DOCX"
    ]) {
      expect(screen.getByRole("button", { name })).toBeDisabled();
    }
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

    expect(screen.getByText("Предупреждений пока нет")).toBeInTheDocument();
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
    expect(screen.getByRole("complementary")).toBeInTheDocument();
  });

  it("keeps preview as API placeholder without rendered Markdown", () => {
    render(<App />);

    expect(
      screen.getByText(/Предпросмотр будет реализован в MVP-18/)
    ).toBeInTheDocument();
  });

  it("does not call preview or export APIs while editing Markdown", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<App />);

    fireEvent.change(screen.getByRole("textbox", { name: "Markdown-текст" }), {
      target: { value: "# Новый документ" }
    });

    expect(fetchSpy).not.toHaveBeenCalled();
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
});

function markdownFile(name: string, content: string): File {
  const file = new File([content], name, { type: "text/markdown" });
  Object.defineProperty(file, "text", {
    value: () => Promise.resolve(content)
  });
  return file;
}
