import { defaultConfig, type ConversionConfig } from "@md-to-docx/config-schema";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cloneConversionConfig } from "../../../state/config-state.js";
import { useConfigState } from "../../../state/useConfigState.js";
import {
  millimetersToTwip,
  updatePageMarginMillimeters,
  updatePageSizePreset
} from "../config-update.js";
import { StyleSettingsPanel } from "../StyleSettingsPanel.js";
import {
  exportConfigJson,
  formatConfigJson,
  MAX_CONFIG_JSON_FILE_SIZE_BYTES,
  parseJsonConfigDraft
} from "../json-config-mode.js";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

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
    expect(screen.getByRole("tab", { name: "JSON-режим" })).toBeInTheDocument();
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

  it("renders JSON mode and shows current config", () => {
    renderSettings();
    openMode("JSON-режим");

    const editor = jsonEditor();

    expect(editor.value).toContain('"version": "1.0.0"');
    expect(editor.value).toContain('"advanced"');
  });

  it("exports JSON without UI-only state", () => {
    const exported = JSON.parse(formatConfigJson(defaultConfig)) as Record<
      string,
      unknown
    >;

    expect(exported.version).toBe("1.0.0");
    expect(exported.input).toBeDefined();
    expect(exported.advanced).toBeDefined();
    expect(exported.isDirty).toBeUndefined();
    expect(exported.lastUpdatedAt).toBeUndefined();
    expect(exported.source).toBeUndefined();
  });

  it("uses browser download for exporting current config", () => {
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    const revokeSpy = vi.fn();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:config"),
      revokeObjectURL: revokeSpy
    });

    exportConfigJson(defaultConfig);

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeSpy).toHaveBeenCalledWith("blob:config");
  });

  it("imports a valid JSON file and updates visual controls", async () => {
    renderSettings();
    openMode("JSON-режим");

    const importedConfig = cloneConversionConfig(defaultConfig);
    importedConfig.document.page.size = {
      ...importedConfig.document.page.size,
      preset: "A3"
    };

    fireEvent.change(screen.getByLabelText("Импортировать JSON-файл настроек"), {
      target: {
        files: [jsonFile("settings.json", formatConfigJson(importedConfig))]
      }
    });

    expect(await screen.findByText("Импортирован файл: settings.json")).toBeInTheDocument();
    openMode("Визуальный режим");

    expect(screen.getByLabelText("Размер страницы")).toHaveValue("A3");
  });

  it("shows a Russian syntax error for invalid JSON import", async () => {
    renderSettings();
    openMode("JSON-режим");

    fireEvent.change(screen.getByLabelText("Импортировать JSON-файл настроек"), {
      target: {
        files: [jsonFile("broken.json", "{")]
      }
    });

    expect(
      await screen.findByText("JSON содержит синтаксическую ошибку. Проверьте формат файла.")
    ).toBeInTheDocument();
  });

  it("shows config diagnostics for schema-invalid JSON", () => {
    renderSettings();
    openMode("JSON-режим");

    fireEvent.change(jsonEditor(), {
      target: {
        value: JSON.stringify({ ...defaultConfig, version: undefined })
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "Применить JSON" }));

    expect(screen.getByText('Поле "version" обязательно.')).toBeInTheDocument();
    expect(screen.getByText("Код: config.validation.required")).toBeInTheDocument();
  });

  it("does not overwrite config state when JSON is invalid", () => {
    renderSettings();

    fireEvent.change(screen.getByLabelText("Размер страницы"), {
      target: { value: "A3" }
    });
    openMode("JSON-режим");
    fireEvent.change(jsonEditor(), { target: { value: "{" } });
    fireEvent.click(screen.getByRole("button", { name: "Применить JSON" }));
    openMode("Визуальный режим");

    expect(screen.getByLabelText("Размер страницы")).toHaveValue("A3");
  });

  it("keeps JSON editor draft unapplied until Apply is clicked", () => {
    renderSettings();
    openMode("JSON-режим");

    const config = cloneConversionConfig(defaultConfig);
    config.document.page.size = { ...config.document.page.size, preset: "Legal" };
    fireEvent.change(jsonEditor(), {
      target: { value: formatConfigJson(config) }
    });
    openMode("Визуальный режим");

    expect(screen.getByLabelText("Размер страницы")).toHaveValue("A4");
  });

  it("applies valid JSON editor draft to config state", () => {
    renderSettings();
    openMode("JSON-режим");

    const config = cloneConversionConfig(defaultConfig);
    config.document.page.size = { ...config.document.page.size, preset: "Legal" };
    fireEvent.change(jsonEditor(), {
      target: { value: formatConfigJson(config) }
    });
    fireEvent.click(screen.getByRole("button", { name: "Применить JSON" }));
    openMode("Визуальный режим");

    expect(screen.getByLabelText("Размер страницы")).toHaveValue("Legal");
  });

  it("resets unsaved JSON draft to current config", () => {
    renderSettings();
    openMode("JSON-режим");

    fireEvent.change(jsonEditor(), { target: { value: "{" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Сбросить изменения JSON" })
    );

    expect(jsonEditor().value).toContain('"version": "1.0.0"');
    expect(screen.getByText("JSON валиден")).toBeInTheDocument();
  });

  it("reflects visual changes in JSON mode", () => {
    renderSettings();

    fireEvent.change(screen.getByLabelText("Размер страницы"), {
      target: { value: "Letter" }
    });
    openMode("JSON-режим");

    expect(jsonEditor().value).toContain('"preset": "Letter"');
  });

  it("keeps applied JSON changes when returning to visual mode", () => {
    renderSettings();
    openMode("JSON-режим");

    const config = cloneConversionConfig(defaultConfig);
    config.defaults.run = {
      ...config.defaults.run,
      font: { ascii: "Arial", hAnsi: "Arial", cs: "Arial", eastAsia: "Arial" }
    };
    fireEvent.change(jsonEditor(), {
      target: { value: formatConfigJson(config) }
    });
    fireEvent.click(screen.getByRole("button", { name: "Применить JSON" }));
    openMode("Визуальный режим");
    openSection("Обычный текст");

    expect(screen.getByLabelText("Шрифт обычного текста")).toHaveValue("Arial");
  });

  it("round-trips visual config through JSON parse", () => {
    const config = cloneConversionConfig(defaultConfig);
    const changed = updatePageSizePreset(config, "A3");
    const parsed = parseJsonConfigDraft(formatConfigJson(changed));

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.config.document.page.size.preset).toBe("A3");
      expect(parsed.config.advanced).toEqual(defaultConfig.advanced);
    }
  });

  it("shows a Russian error for unsupported JSON file extension", async () => {
    renderSettings();
    openMode("JSON-режим");

    fireEvent.change(screen.getByLabelText("Импортировать JSON-файл настроек"), {
      target: {
        files: [jsonFile("settings.txt", "{}")]
      }
    });

    expect(
      await screen.findByText("Формат файла не поддерживается. Разрешены только .json.")
    ).toBeInTheDocument();
  });

  it("shows a Russian error for too large JSON file", async () => {
    renderSettings();
    openMode("JSON-режим");

    fireEvent.change(screen.getByLabelText("Импортировать JSON-файл настроек"), {
      target: {
        files: [largeJsonFile()]
      }
    });

    expect(
      await screen.findByText("Размер JSON-файла превышает допустимый лимит.")
    ).toBeInTheDocument();
  });

  it("exposes JSON mode controls with Russian labels", () => {
    renderSettings();
    openMode("JSON-режим");

    expect(screen.getByLabelText("JSON конфигурации")).toBeInTheDocument();
    for (const name of [
      "Применить JSON",
      "Сбросить изменения JSON",
      "Импортировать JSON",
      "Экспортировать JSON"
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });
});

function renderSettings() {
  return render(<SettingsHarness />);
}

function SettingsHarness() {
  const { state, updateConfig, replaceConfig } = useConfigState();

  return (
    <section aria-labelledby="settings-heading">
      <StyleSettingsPanel
        configState={state}
        replaceConfig={replaceConfig}
        updateConfig={updateConfig}
      />
      <output data-testid="config-state">
        {JSON.stringify(state.config)}
      </output>
    </section>
  );
}

function openSection(name: string) {
  fireEvent.click(screen.getByRole("tab", { name }));
}

function openMode(name: "Визуальный режим" | "JSON-режим") {
  fireEvent.click(screen.getByRole("tab", { name }));
}

function jsonEditor(): HTMLTextAreaElement {
  return screen.getByLabelText("JSON конфигурации") as HTMLTextAreaElement;
}

function readConfig(): ConversionConfig {
  const serializedConfig = screen.getByTestId("config-state").textContent;
  if (!serializedConfig) {
    throw new Error("Config state output is empty");
  }

  return JSON.parse(serializedConfig) as ConversionConfig;
}

function jsonFile(name: string, content: string): File {
  const file = new File([content], name, { type: "application/json" });
  Object.defineProperty(file, "text", {
    value: () => Promise.resolve(content)
  });
  return file;
}

function largeJsonFile(): File {
  const file = new File([new Uint8Array(MAX_CONFIG_JSON_FILE_SIZE_BYTES + 1)], "large.json", {
    type: "application/json"
  });
  Object.defineProperty(file, "text", {
    value: () => Promise.resolve("{}")
  });
  return file;
}
