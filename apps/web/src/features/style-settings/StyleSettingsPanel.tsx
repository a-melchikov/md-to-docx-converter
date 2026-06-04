import { useState } from "react";

import type { ConfigState, ConfigUpdater } from "../../state/config-state.js";
import { CodeSettingsForm } from "./CodeSettingsForm.js";
import { DocumentSettingsForm } from "./DocumentSettingsForm.js";
import { FontSettingsForm } from "./FontSettingsForm.js";
import { HeadingSettingsForm } from "./HeadingSettingsForm.js";
import { ListSettingsForm } from "./ListSettingsForm.js";
import { PageMarginsForm } from "./PageMarginsForm.js";
import { ParagraphSettingsForm } from "./ParagraphSettingsForm.js";
import { QuoteSettingsForm } from "./QuoteSettingsForm.js";
import { TableSettingsForm } from "./TableSettingsForm.js";

const settingsSections = [
  "Документ",
  "Поля страницы",
  "Шрифты",
  "Заголовки",
  "Обычный текст",
  "Код",
  "Списки",
  "Таблицы",
  "Цитаты"
] as const;

type StyleSettingsSection = (typeof settingsSections)[number];

export interface StyleSettingsPanelProps {
  readonly configState: ConfigState;
  readonly updateConfig: (updater: ConfigUpdater) => void;
}

export function StyleSettingsPanel({
  configState,
  updateConfig
}: StyleSettingsPanelProps) {
  const [activeSection, setActiveSection] =
    useState<StyleSettingsSection>("Документ");

  return (
    <>
      <div className="panel-heading">
        <div>
          <p className="panel-label">Конфигурация</p>
          <h2 id="settings-heading">Настройки</h2>
        </div>
        <span className="panel-status">
          {configState.isDirty ? "изменено" : "по умолчанию"}
        </span>
      </div>
      <div
        className="settings-tabs"
        role="tablist"
        aria-label="Разделы настроек"
      >
        {settingsSections.map((section) => (
          <button
            aria-controls={`settings-panel-${section}`}
            aria-selected={activeSection === section}
            className="settings-tab"
            id={`settings-tab-${section}`}
            key={section}
            role="tab"
            type="button"
            onClick={() => setActiveSection(section)}
          >
            {section}
          </button>
        ))}
      </div>
      <div
        aria-labelledby={`settings-tab-${activeSection}`}
        className="settings-readout"
        id={`settings-panel-${activeSection}`}
        role="tabpanel"
      >
        {renderSettingsSection(activeSection, configState, updateConfig)}
        <p className="helper-text">
          Эти визуальные поля обновляют общую модель конфигурации. JSON
          import/export будет реализован в MVP-17.
        </p>
      </div>
    </>
  );
}

function renderSettingsSection(
  section: StyleSettingsSection,
  configState: ConfigState,
  updateConfig: (updater: ConfigUpdater) => void
) {
  const props = {
    config: configState.config,
    updateConfig
  };

  switch (section) {
    case "Документ":
      return <DocumentSettingsForm {...props} />;
    case "Поля страницы":
      return <PageMarginsForm {...props} />;
    case "Шрифты":
      return <FontSettingsForm {...props} />;
    case "Заголовки":
      return <HeadingSettingsForm {...props} />;
    case "Обычный текст":
      return <ParagraphSettingsForm {...props} />;
    case "Код":
      return <CodeSettingsForm {...props} />;
    case "Списки":
      return <ListSettingsForm {...props} />;
    case "Таблицы":
      return <TableSettingsForm {...props} />;
    case "Цитаты":
      return <QuoteSettingsForm {...props} />;
  }
}
