import { useId, useMemo, useState } from "react";
import { defaultConfig } from "@md-to-docx/config-schema";

const initialMarkdown = `# Заголовок документа

Короткий абзац Markdown для будущей конвертации в DOCX.

- Первый пункт
- Второй пункт
`;

const toolbarActions = [
  "Открыть Markdown",
  "Импорт настроек",
  "Экспорт настроек",
  "Скачать DOCX"
] as const;

const settingsTabs = [
  "Документ",
  "Заголовки",
  "Обычный текст",
  "Код",
  "Списки",
  "Таблицы"
] as const;

type SettingsTab = (typeof settingsTabs)[number];

export function App() {
  const editorId = useId();
  const editorDescriptionId = useId();
  const [markdownDraft, setMarkdownDraft] = useState(initialMarkdown);
  const [activeSettingsTab, setActiveSettingsTab] =
    useState<SettingsTab>("Документ");
  const [previewZoom, setPreviewZoom] = useState(100);
  const settingsDetails = useMemo(
    () => settingsDetailsFor(activeSettingsTab),
    [activeSettingsTab]
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-title-group">
          <p className="app-kicker">Конвертер документов</p>
          <h1>MD → DOCX</h1>
          <p className="app-description">Конвертация Markdown в DOCX</p>
        </div>
        <nav className="app-actions" aria-label="Действия с документом">
          {toolbarActions.map((action) => (
            <button
              className="action-button"
              disabled
              key={action}
              title="Будет реализовано в следующих задачах"
              type="button"
            >
              {action}
            </button>
          ))}
        </nav>
      </header>

      <main className="workspace" aria-label="Рабочая область конвертации">
        <section
          className="panel editor-panel"
          aria-labelledby="editor-heading"
        >
          <div className="panel-heading">
            <div>
              <p className="panel-label">Ввод</p>
              <h2 id="editor-heading">Редактор Markdown</h2>
            </div>
            <span className="panel-status">Черновик</span>
          </div>
          <label className="field-label" htmlFor={editorId}>
            Markdown-текст
          </label>
          <textarea
            aria-describedby={editorDescriptionId}
            className="markdown-editor"
            id={editorId}
            spellCheck={false}
            value={markdownDraft}
            onChange={(event) => setMarkdownDraft(event.target.value)}
          />
          <p className="helper-text" id={editorDescriptionId}>
            Полноценный редактор и загрузка файлов будут реализованы в MVP-15.
          </p>
        </section>

        <section
          className="panel preview-panel"
          aria-labelledby="preview-heading"
        >
          <div className="panel-heading">
            <div>
              <p className="panel-label">Вывод</p>
              <h2 id="preview-heading">Предпросмотр</h2>
            </div>
            <label className="zoom-control">
              <span>Масштаб {previewZoom}%</span>
              <input
                aria-label="Масштаб предпросмотра"
                max="150"
                min="50"
                step="10"
                type="range"
                value={previewZoom}
                onChange={(event) => setPreviewZoom(Number(event.target.value))}
              />
            </label>
          </div>
          <div className="preview-stage">
            <div
              className="preview-page"
              style={{ transform: `scale(${previewZoom / 100})` }}
            >
              <div className="preview-page-content">
                <p className="preview-placeholder">
                  Предпросмотр будет построен через API /api/v1/preview/html
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside
          className="panel settings-panel"
          aria-labelledby="settings-heading"
        >
          <div className="panel-heading">
            <div>
              <p className="panel-label">Конфигурация</p>
              <h2 id="settings-heading">Настройки</h2>
            </div>
          </div>
          <div
            className="settings-tabs"
            role="tablist"
            aria-label="Разделы настроек"
          >
            {settingsTabs.map((tab) => (
              <button
                aria-controls={`settings-panel-${tab}`}
                aria-selected={activeSettingsTab === tab}
                className="settings-tab"
                id={`settings-tab-${tab}`}
                key={tab}
                role="tab"
                type="button"
                onClick={() => setActiveSettingsTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div
            aria-labelledby={`settings-tab-${activeSettingsTab}`}
            className="settings-readout"
            id={`settings-panel-${activeSettingsTab}`}
            role="tabpanel"
          >
            <dl>
              {settingsDetails.map((item) => (
                <div className="settings-row" key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
            <p className="helper-text">
              Визуальное редактирование настроек будет реализовано в MVP-16.
            </p>
          </div>
        </aside>

        <section
          className="panel warnings-panel"
          aria-labelledby="warnings-heading"
        >
          <div className="panel-heading">
            <div>
              <p className="panel-label">Диагностика</p>
              <h2 id="warnings-heading">Предупреждения</h2>
            </div>
            <span className="panel-status">0</span>
          </div>
          <div className="empty-warning-state" role="status">
            <strong>Предупреждений пока нет</strong>
            <span>
              Реальные предупреждения появятся здесь после интеграции конвейера
              обработки в MVP-20.
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}

interface SettingsDetail {
  readonly label: string;
  readonly value: string;
}

function settingsDetailsFor(tab: SettingsTab): readonly SettingsDetail[] {
  switch (tab) {
    case "Документ":
      return [
        {
          label: "Размер страницы",
          value: defaultConfig.document.page.size.preset
        },
        {
          label: "Ориентация",
          value: defaultConfig.document.page.size.orientation
        },
        {
          label: "Поля",
          value: `${defaultConfig.document.page.margin.topTwip} твип`
        }
      ];
    case "Заголовки":
      return [
        {
          label: "Заголовок 1",
          value: `${defaultConfig.styles.heading1.run?.sizeHalfPt} полупунктов`
        },
        {
          label: "Заголовок 2",
          value: `${defaultConfig.styles.heading2.run?.sizeHalfPt} полупунктов`
        }
      ];
    case "Обычный текст":
      return [
        {
          label: "Шрифт",
          value: defaultConfig.defaults.run.font?.ascii ?? "Times New Roman"
        },
        {
          label: "Размер",
          value: `${defaultConfig.defaults.run.sizeHalfPt} полупунктов`
        }
      ];
    case "Код":
      return [
        {
          label: "Строчный код",
          value: defaultConfig.styles.inlineCode.run?.font?.ascii ?? "Courier New"
        },
        {
          label: "Блок кода",
          value: defaultConfig.styles.codeBlock.run?.font?.ascii ?? "Courier New"
        }
      ];
    case "Списки":
      return [
        {
          label: "Маркированный список",
          value: defaultConfig.numbering.unordered.levels[0]?.text ?? "•"
        },
        {
          label: "Нумерованный список",
          value: numberingFormatLabel(
            defaultConfig.numbering.ordered.levels[0]?.format
          )
        }
      ];
    case "Таблицы":
      return [
        { label: "Ширина", value: `${defaultConfig.defaults.table.widthPct}%` },
        {
          label: "Отступ ячейки",
          value: `${defaultConfig.defaults.table.cellMarginTwip} твип`
        }
      ];
  }
}

function numberingFormatLabel(format: string | undefined): string {
  switch (format) {
    case "decimal":
      return "десятичная нумерация";
    case "lowerLetter":
      return "строчные буквы";
    case "upperLetter":
      return "заглавные буквы";
    case "lowerRoman":
      return "строчные римские цифры";
    case "upperRoman":
      return "заглавные римские цифры";
    case "bullet":
      return "маркер";
    default:
      return "десятичная нумерация";
  }
}
