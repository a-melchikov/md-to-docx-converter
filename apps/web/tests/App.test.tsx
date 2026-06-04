import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "../src/App.js";

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
      screen.getByText("Предпросмотр будет построен через API /api/v1/preview/html")
    ).toBeInTheDocument();
  });
});
