import { defaultConfig, type ConversionConfig } from "@md-to-docx/config-schema";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { cloneConversionConfig } from "../../../state/config-state.js";
import { useConfigState } from "../../../state/useConfigState.js";
import {
  millimetersToTwip,
  updatePageMarginMillimeters,
  updatePageSizePreset
} from "../config-update.js";
import { StyleSettingsPanel } from "../StyleSettingsPanel.js";

describe("StyleSettingsPanel", () => {
  it("renders visual settings sections in Russian", () => {
    renderSettings();

    for (const name of [
      "Документ",
      "Поля страницы",
      "Шрифты",
      "Заголовки",
      "Обычный текст",
      "Код",
      "Списки",
      "Таблицы",
      "Цитаты"
    ]) {
      expect(screen.getByRole("tab", { name })).toBeInTheDocument();
    }
  });

  it("updates page size in config state", () => {
    renderSettings();

    fireEvent.change(screen.getByLabelText("Размер страницы"), {
      target: { value: "A3" }
    });

    expect(readConfig().document.page.size.preset).toBe("A3");
  });

  it("stores positive custom page dimensions in Twip", () => {
    renderSettings();

    fireEvent.change(screen.getByLabelText("Размер страницы"), {
      target: { value: "custom" }
    });
    fireEvent.change(screen.getByLabelText("Ширина страницы, мм"), {
      target: { value: "200" }
    });

    expect(readConfig().document.page.size.preset).toBe("custom");
    expect(readConfig().document.page.size.widthTwip).toBe(
      millimetersToTwip(200)
    );
    expect(readConfig().document.page.size.heightTwip).toBeGreaterThan(0);
  });

  it("updates page orientation in config state", () => {
    renderSettings();

    fireEvent.change(screen.getByLabelText("Ориентация страницы"), {
      target: { value: "landscape" }
    });

    expect(readConfig().document.page.size.orientation).toBe("landscape");
  });

  it("converts page margins from millimeters to Twip", () => {
    renderSettings();
    openSection("Поля страницы");

    fireEvent.change(screen.getByLabelText("Верхнее поле, мм"), {
      target: { value: "20" }
    });

    expect(readConfig().document.page.margin.topTwip).toBe(
      millimetersToTwip(20)
    );
  });

  it("updates normal text font family", () => {
    renderSettings();
    openSection("Обычный текст");

    fireEvent.change(screen.getByLabelText("Шрифт обычного текста"), {
      target: { value: "Arial" }
    });

    expect(readConfig().defaults.run.font?.ascii).toBe("Arial");
  });

  it("converts font size from pt to sizeHalfPt", () => {
    renderSettings();
    openSection("Шрифты");

    fireEvent.change(screen.getByLabelText("Размер шрифта, pt"), {
      target: { value: "13" }
    });

    expect(readConfig().defaults.run.sizeHalfPt).toBe(26);
  });

  it("updates heading1 size and bold flag", () => {
    renderSettings();
    openSection("Заголовки");

    fireEvent.change(screen.getByLabelText("Размер заголовка 1, pt"), {
      target: { value: "21" }
    });
    fireEvent.click(screen.getByLabelText("Жирный заголовок 1"));

    expect(readConfig().styles.heading1.run?.sizeHalfPt).toBe(42);
    expect(readConfig().styles.heading1.run?.bold).toBe(false);
  });

  it("updates paragraph alignment", () => {
    renderSettings();
    openSection("Обычный текст");

    fireEvent.change(screen.getByLabelText("Выравнивание абзаца"), {
      target: { value: "center" }
    });

    expect(readConfig().defaults.paragraph.alignment).toBe("center");
  });

  it("updates inline code font and background", () => {
    renderSettings();
    openSection("Код");

    fireEvent.change(screen.getByLabelText("Шрифт строчного кода"), {
      target: { value: "Arial" }
    });
    fireEvent.change(screen.getByLabelText("Фон строчного кода, HEX"), {
      target: { value: "ABCDEF" }
    });

    expect(readConfig().styles.inlineCode.run?.font?.ascii).toBe("Arial");
    expect(readConfig().styles.inlineCode.shading?.fill).toBe("ABCDEF");
  });

  it("updates list settings", () => {
    renderSettings();
    openSection("Списки");

    fireEvent.change(screen.getByLabelText("Символ маркера"), {
      target: { value: "-" }
    });
    fireEvent.change(screen.getByLabelText("Формат нумерации"), {
      target: { value: "lowerRoman" }
    });

    expect(readConfig().numbering.unordered.levels[0]?.text).toBe("-");
    expect(readConfig().numbering.ordered.levels[0]?.format).toBe("lowerRoman");
  });

  it("updates table settings", () => {
    renderSettings();
    openSection("Таблицы");

    fireEvent.change(screen.getByLabelText("Ширина таблицы, %"), {
      target: { value: "80" }
    });
    fireEvent.click(screen.getByLabelText("Жирный заголовок таблицы"));

    expect(readConfig().defaults.table.widthPct).toBe(80);
    expect(readConfig().styles.tableHeader.run?.bold).toBe(false);
  });

  it("updates quote settings", () => {
    renderSettings();
    openSection("Цитаты");

    fireEvent.change(screen.getByLabelText("Фон цитаты, HEX"), {
      target: { value: "FFFFF0" }
    });
    fireEvent.click(screen.getByLabelText("Курсив в цитате"));

    expect(readConfig().styles.blockquote.shading?.fill).toBe("FFFFF0");
    expect(readConfig().styles.blockquote.run?.italic).toBe(true);
  });

  it("shows a Russian error for invalid font size", () => {
    renderSettings();
    openSection("Шрифты");

    fireEvent.change(screen.getByLabelText("Размер шрифта, pt"), {
      target: { value: "-1" }
    });

    expect(
      screen.getByText("Размер шрифта должен быть больше 0.")
    ).toBeInTheDocument();
  });

  it("shows a Russian error for invalid color", () => {
    renderSettings();
    openSection("Шрифты");

    fireEvent.change(screen.getByLabelText("Цвет текста, HEX"), {
      target: { value: "ZZZZZZ" }
    });

    expect(
      screen.getByText("Цвет должен быть в формате HEX, например FF0000.")
    ).toBeInTheDocument();
  });

  it("does not require manual JSON editing for basic settings", () => {
    renderSettings();

    expect(screen.getByLabelText("Размер страницы")).toBeInTheDocument();
    expect(screen.queryByLabelText("JSON")).not.toBeInTheDocument();
  });

  it("preserves unrelated config sections after helper updates", () => {
    const config = cloneConversionConfig(defaultConfig);
    const withMargin = updatePageMarginMillimeters(config, "topTwip", 20);
    const withPageSize = updatePageSizePreset(withMargin, "Letter");

    expect(withPageSize.version).toBe(config.version);
    expect(withPageSize.meta).toEqual(config.meta);
    expect(withPageSize.input).toEqual(config.input);
    expect(withPageSize.headersFooters).toEqual(config.headersFooters);
    expect(withPageSize.advanced).toEqual(config.advanced);
    expect(withPageSize.styles.heading1).toEqual(config.styles.heading1);
  });
});

function renderSettings() {
  return render(<SettingsHarness />);
}

function SettingsHarness() {
  const { state, updateConfig } = useConfigState();

  return (
    <section aria-labelledby="settings-heading">
      <StyleSettingsPanel configState={state} updateConfig={updateConfig} />
      <output data-testid="config-state">
        {JSON.stringify(state.config)}
      </output>
    </section>
  );
}

function openSection(name: string) {
  fireEvent.click(screen.getByRole("tab", { name }));
}

function readConfig(): ConversionConfig {
  const serializedConfig = screen.getByTestId("config-state").textContent;
  if (!serializedConfig) {
    throw new Error("Config state output is empty");
  }

  return JSON.parse(serializedConfig) as ConversionConfig;
}
