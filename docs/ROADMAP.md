# Roadmap

## Общая стратегия

Проект реализуется поэтапно, чтобы каждое крупное изменение можно было проверить отдельно и не смешивать frontend, backend, packages и infra в одном неструктурированном изменении.

Приоритеты соответствуют `docs/PROJECT_SPEC.md`, `docs/PROJECT_BRIEF.md` и ограничениям из `docs/CODEX_INSTRUCTIONS.md`.

## MVP

Цель MVP - дать рабочий end-to-end сценарий:

```text
Markdown input
  -> config validation
  -> parse
  -> style resolution
  -> fast HTML preview
  -> DOCX export
  -> warnings
```

### Входит в MVP

- Monorepo skeleton на `pnpm`.
- `apps/web` на React + TypeScript + Vite.
- `apps/api` на Node.js + TypeScript + Fastify.
- `packages/domain` с общей моделью.
- `packages/config-schema` с JSON Schema Draft 2020-12 и Zod-слоем.
- `packages/md-parser` для CommonMark/GFM.
- `packages/style-engine` для базового каскада стилей.
- `packages/docx-adapter` для DOCX export через `docx`.
- `packages/html-preview` для fast docx-like preview.
- JSON import/export.
- Visual UI для базовых настроек документа и стилей.
- Панель warnings/errors.
- Healthcheck/readiness endpoints.
- Docker Compose запуск.
- Базовые unit/integration tests.

### Markdown/DOCX scope MVP

Поддерживаемые элементы:

- paragraphs;
- headings `h1-h6`;
- emphasis/strong/strike;
- inline code;
- fenced/indented code blocks;
- blockquote;
- ordered/bullet/nested lists;
- links/autolinks;
- images as inline images;
- tables;
- task lists;
- thematic break.

Ограниченно:

- raw HTML через whitelist subset и warnings;
- Mermaid только как подготовленная image/render task, без обещания raw syntax в DOCX.

### Не входит в MVP

- accurate preview через DOCX rendering;
- импорт DOCX-шаблонов;
- headers/footers;
- page numbers;
- batch conversion;
- API token;
- comments/bookmarks/fields;
- track changes;
- floating images/wrap modes;
- visual regression tests;
- plugin architecture;
- advanced OOXML override UI.

### Критерии готовности MVP

- `pnpm install` проходит без ошибок.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` проходят.
- `docker compose up` поднимает web, api и nginx.
- `/api/v1/health` и `/api/v1/ready` отвечают успешно.
- Пользователь может ввести Markdown, настроить базовые стили через русский UI, увидеть fast preview и скачать DOCX.
- Пользователь может импортировать и экспортировать JSON-конфигурацию.
- Unsupported Markdown/HTML, invalid XML chars, fallback styles и config validation errors отображаются как warnings/errors.
- DOCX export использует `docx`, не ручную конкатенацию XML.

## R2

Цель R2 - повысить точность preview, добавить шаблоны и расширить серверные сценарии.

### Входит в R2

- Accurate preview pipeline:
  - generate DOCX;
  - render через `docx-preview`;
  - warnings о fidelity limits.
- Импорт DOCX-шаблонов:
  - styles;
  - numbering;
  - theme;
  - headers/footers metadata.
- Headers/footers.
- Page numbers.
- Footnotes/endnotes, если MVP-модель готова к расширению.
- Batch conversion.
- API token для защищенного API-доступа.
- Versioning/migrations для конфигураций.
- Кэширование preview/export по hash входных данных.
- Улучшенные integration tests для API.

### Не входит в R2

- полноценный OOXML editor;
- track changes UI;
- comments/bookmarks/fields UI;
- floating image wrap modes;
- plugin marketplace/runtime;
- visual regression baseline как обязательный release gate.

### Критерии готовности R2

- accurate preview работает как отдельный режим и не заменяет fast preview.
- Импорт DOCX-шаблона не ломает базовый export без шаблона.
- Headers/footers и page numbers доступны через visual UI и JSON.
- Batch conversion имеет лимиты, diagnostics и job status.
- API token не смешан с бизнес-логикой конвертации.
- Конфигурации мигрируются между версиями без потери поддерживаемых полей.

## R3

Цель R3 - добавить advanced-возможности и повысить качество визуального соответствия.

### Входит в R3

- Plugin architecture для расширения parser/style/output steps.
- Advanced OOXML overrides.
- Comments.
- Bookmarks.
- Fields.
- Track changes support или explicit compatibility policy.
- Floating images и wrap modes.
- Visual regression tests.
- Расширенные golden tests для DOCX package parts.
- Опциональная DOCX->PDF preview pipeline после оценки runtime/deploy стоимости.

### Критерии готовности R3

- Plugins имеют стабильный контракт и не могут обходить validation/diagnostics.
- Advanced overrides валидируются и изолированы от базовой конфигурации.
- Comments/bookmarks/fields покрыты unit/golden tests.
- Floating images имеют понятные ограничения и warnings.
- Visual regression tests входят в CI или отдельный release check.

## Риски и ограничения

- `docx-preview` не является Word layout engine.
- Raw HTML нельзя обещать как полную browser-to-DOCX конвертацию.
- Floating objects, revisions и fields резко увеличивают сложность.
- Итоговая типографика зависит от доступных шрифтов.
- JSON mode не должен вытеснять visual UI.
- Любой TODO должен сопровождаться задачей в `docs/TASKS.md`.

## Последовательность крупных этапов

```text
1. Architecture docs
2. Monorepo skeleton
3. Shared domain and config schema
4. Parser MVP
5. Style Engine MVP
6. DOCX adapter MVP
7. HTML preview MVP
8. API MVP orchestration
9. Web MVP UI
10. Docker/deploy
11. Tests and hardening
12. R2 preview/templates/batch/auth
13. R3 advanced OOXML/plugins/visual regression
```
