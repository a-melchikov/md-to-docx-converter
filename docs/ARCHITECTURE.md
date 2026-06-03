# Архитектура проекта md-to-docx-converter

## Назначение

`md-to-docx-converter` - веб-приложение для конвертации Markdown в DOCX с визуальной настройкой стилей, live preview, импортом/экспортом JSON-конфигураций и системой предупреждений.

Документ фиксирует целевую архитектуру перед созданием monorepo skeleton. Он не описывает реализацию бизнес-логики и не вводит временные mock-решения.

## Источники требований

Основные документы:

- `docs/PROJECT_SPEC.md` - главный источник требований.
- `docs/PROJECT_BRIEF.md` - краткая выжимка требований и приоритетов.
- `docs/CODEX_INSTRUCTIONS.md` - правила поэтапной реализации.
- `README.md` - публичное описание проекта и ожидаемая структура.

## Архитектурные принципы

1. Проект реализуется как TypeScript monorepo на `pnpm`.
2. Frontend и backend разделены физически и логически.
3. Route handlers API не содержат бизнес-логику.
4. JSON-конфигурация является переносимым форматом импорта/экспорта, но не основным пользовательским интерфейсом настройки.
5. Конвертация и preview используют единый pipeline:

```text
Markdown
  -> MDAST
  -> normalized intermediate document model
  -> resolved style model
  -> DOCX adapter
  -> HTML preview adapter
```

6. DOCX не генерируется ручной конкатенацией XML-строк. Для генерации используется npm-пакет `docx`.
7. Markdown parsing строится на `unified`, `remark-parse` и `remark-gfm`.
8. Точный preview не строится на Mammoth. Mammoth можно рассматривать только как semantic HTML-инструмент, но не как faithful preview.
9. Все предупреждения собираются в единую модель diagnostics/warnings и возвращаются через UI/API.
10. Расширенные OOXML-настройки изолируются в `advanced`-части конфигурации и не смешиваются с базовым visual UI.

## Целевая структура monorepo

```text
md-to-docx-converter/
  apps/
    web/
      src/
      tests/
      package.json
      vite.config.ts
      tsconfig.json

    api/
      src/
      tests/
      package.json
      tsconfig.json

  packages/
    domain/
      src/
      tests/
      package.json
      tsconfig.json

    config-schema/
      src/
      schema/
      tests/
      package.json
      tsconfig.json

    md-parser/
      src/
      tests/
      package.json
      tsconfig.json

    style-engine/
      src/
      tests/
      package.json
      tsconfig.json

    docx-adapter/
      src/
      tests/
      package.json
      tsconfig.json

    html-preview/
      src/
      tests/
      package.json
      tsconfig.json

  infra/
    docker/
      Dockerfile.api
      Dockerfile.web

    nginx/
      nginx.conf

  docs/
    ARCHITECTURE.md
    ROADMAP.md
    TASKS.md
    PROJECT_SPEC.md
    PROJECT_BRIEF.md
    CODEX_INSTRUCTIONS.md

  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  docker-compose.yml
  .env.example
```

На этапе skeleton допустимы только пустые entrypoint/placeholder-файлы, нужные для компиляции структуры. Бизнес-логика конвертации, preview и UI-настроек должна добавляться отдельными задачами.

## Пакеты и ответственность

### `apps/web`

Frontend-приложение на React + TypeScript + Vite.

Ответственность:

- русский UI;
- Markdown editor;
- визуальные формы настройки DOCX;
- JSON mode для импорта/экспорта конфигурации;
- live preview;
- панель warnings/errors;
- взаимодействие с API;
- responsive layout для desktop/mobile.

Не должно содержать:

- серверную бизнес-логику;
- собственную независимую модель конфигурации, расходящуюся с `packages/domain` и `packages/config-schema`;
- отдельный preview pipeline, который обходит Style Engine.

### `apps/api`

Backend на Node.js + TypeScript + Fastify.

Ответственность:

- HTTP API;
- multipart/file upload limits;
- CORS/rate limit/security middleware;
- orchestration сервисов;
- healthcheck/readiness endpoints;
- валидация входных DTO;
- возврат DOCX/preview/config validation результатов;
- возврат diagnostics.

Не должно содержать:

- бизнес-логику в route handlers;
- ручную генерацию OOXML;
- временные mock-конвертеры как основу API.

### `packages/domain`

Общая доменная модель проекта.

Ответственность:

- типы intermediate document model;
- типы Markdown node mapping;
- типы resolved style model;
- типы warnings/diagnostics;
- типы API DTO, если они являются общими для web/api;
- branded/unit-типы для `twip`, `halfPt`, `emu`, `pct`.

Пакет не должен зависеть от `apps/*`, `docx`, React или Fastify.

## Domain model

`packages/domain` является независимым базовым пакетом monorepo. Он задает общие типы и минимальные безопасные helper-функции, которые используются остальными пакетами, но сам не зависит от frontend, backend, parser или output adapters.

Разрешено зависеть от `packages/domain`:

- `apps/web`;
- `apps/api`;
- `packages/config-schema`;
- `packages/md-parser`;
- `packages/style-engine`;
- `packages/docx-adapter`;
- `packages/html-preview`.

Запрещено:

- `packages/domain -> apps/*`;
- `packages/domain -> packages/md-parser`;
- `packages/domain -> packages/style-engine`;
- `packages/domain -> packages/docx-adapter`;
- `packages/domain -> packages/html-preview`;
- `packages/domain -> React/Vite/Fastify/docx/unified/remark`;
- любые обратные зависимости от domain к adapter-пакетам или infra.

Domain model включает четыре базовых слоя.

Intermediate document model:

- платформенно нейтральный root `document`;
- block-level nodes для paragraph, heading `h1-h6`, blockquote, unordered/ordered lists, list items, code blocks, thematic break, tables, table rows/cells, block images и unsupported blocks;
- inline-level nodes для text, strong, emphasis, strikethrough, inline code, links, inline images, hard/soft breaks и unsupported inline nodes;
- типобезопасные `attrs`/`metadata` без `any`;
- отсутствие прямых `mdast`, DOM, `docx` или framework-specific типов.

Diagnostics:

- severity: `info`, `warning`, `error`;
- коды для unsupported Markdown node, invalid XML character, fallback style, config validation error, asset warning и preview fidelity warning;
- сообщение, source mapping, path до intermediate node и безопасный metadata record.

Units:

- branded-типы `Twip`, `HalfPoint`, `Emu`, `Pct`;
- factory-функции для запрета смешивания единиц;
- базовая runtime validation для finite/non-negative значений;
- простые conversion helpers для pt/in/cm/px.

Source mapping:

- исходный файл;
- line/column;
- offset/length;
- типизированные path segments, которые можно отобразить как `document.children[3].children[0]`.

### `packages/config-schema`

JSON Schema и TypeScript/Zod-слой конфигурации.

Ответственность:

- JSON Schema Draft 2020-12;
- Zod-схемы или адаптеры для runtime validation;
- дефолтные пресеты;
- миграции версий конфигурации;
- типы `ConverterConfig`;
- функции нормализации пользовательских единиц в canonical storage.

Canonical storage:

- page/margins/paragraph spacing/indents: `twip`;
- font size: `halfPt`;
- drawings/images: `emu`;
- table width: `pct` или `twip` в зависимости от режима.

### `packages/md-parser`

Markdown parser на `unified`/`remark`.

Ответственность:

- парсинг CommonMark/GFM;
- нормализация MDAST в intermediate document model;
- обнаружение unsupported nodes;
- политика raw HTML subset;
- подготовка Mermaid-блоков как отдельных image/render tasks без временной подмены результата;
- source mapping для warnings.

### `packages/style-engine`

Движок применения стилей.

Ответственность:

- разрешение каскада `defaults -> named style -> markdown mapping -> direct override`;
- применение стилей к intermediate document model;
- unit conversions;
- numbering model;
- fallback styles;
- invalid XML character policy;
- подготовка единого resolved model для DOCX и HTML preview.

### `packages/docx-adapter`

Адаптер генерации DOCX.

Ответственность:

- преобразование resolved model в `.docx` через npm-пакет `docx`;
- стили WordprocessingML через API библиотеки;
- numbering, tables, links, images, metadata;
- golden tests на структуру DOCX;
- relationships/media handling.

Не должно содержать:

- Markdown parsing;
- UI-конфигурацию;
- ручную конкатенацию XML.

### `packages/html-preview`

Быстрый HTML docx-like preview.

Ответственность:

- render resolved model в HTML/CSS page boxes;
- zoom;
- responsive preview container;
- отображение warnings;
- приближенное соответствие spacing, fonts, page margins, lists, tables и images.

Ограничение: быстрый HTML preview не считается точной копией Word layout. Более точный preview выносится в R2.

### `infra/docker`

Docker assets.

Ответственность:

- `Dockerfile.api`;
- `Dockerfile.web`;
- multi-stage builds;
- production-like container layout.

### `infra/nginx`

Reverse proxy.

Ответственность:

- `nginx.conf`;
- маршрутизация `/api/*` в API;
- отдача frontend;
- upload/body size limits;
- базовые headers.

## Зависимости между пакетами

Разрешенная схема зависимостей:

```text
apps/web
  -> packages/domain
  -> packages/config-schema
  -> packages/html-preview

apps/api
  -> packages/domain
  -> packages/config-schema
  -> packages/md-parser
  -> packages/style-engine
  -> packages/docx-adapter
  -> packages/html-preview

packages/md-parser
  -> packages/domain

packages/style-engine
  -> packages/domain
  -> packages/config-schema

packages/docx-adapter
  -> packages/domain

packages/html-preview
  -> packages/domain
```

Запрещенные зависимости:

- `packages/* -> apps/*`;
- `packages/domain -> любой инфраструктурный или UI-пакет`;
- `packages/docx-adapter -> apps/api`;
- `packages/md-parser -> packages/docx-adapter`;
- `packages/html-preview -> packages/docx-adapter` для MVP fast preview.

## Pipeline конвертации

```text
1. Input
   Markdown text + assets + ConverterConfig

2. Validation
   Config schema validation
   Input limits
   Markdown profile selection

3. Parse
   Markdown -> MDAST
   MDAST -> intermediate document model
   Parser diagnostics

4. Style resolution
   Config defaults
   Named styles
   Markdown element mappings
   Unit normalization
   Fallback diagnostics

5. Output adapters
   DOCX adapter -> .docx binary
   HTML preview adapter -> preview HTML/CSS model

6. Response
   Artifact + diagnostics + metadata
```

Для export и preview не создаются независимые ветки логики. Разница допускается только на уровне output adapter.

## Intermediate document model

Intermediate model должен быть платформенно нейтральным и не зависеть от `docx` или DOM.

Минимальные группы узлов для MVP:

- document;
- section;
- paragraph;
- heading `h1-h6`;
- text run;
- emphasis/strong/strike;
- inline code;
- code block;
- blockquote;
- ordered/bullet/nested lists;
- link;
- image;
- table;
- thematic break.

R2/R3 расширения:

- headers/footers;
- page numbers;
- footnotes/endnotes;
- comments;
- bookmarks;
- fields;
- floating images;
- advanced OOXML override references.

## Конфигурация

`packages/config-schema` содержит переносимую JSON Schema Draft 2020-12 для конфигурации Markdown -> DOCX. Эта schema используется как единый контракт для backend validation, frontend JSON mode, импорта/экспорта настроек и default config.

Top-level структура конфигурации:

```json
{
  "version": "1.0.0",
  "meta": {},
  "input": {},
  "document": {},
  "defaults": {},
  "styles": {},
  "numbering": {},
  "headersFooters": {},
  "advanced": {}
}
```

Правила:

- схема хранится в `packages/config-schema`;
- UI редактирует ту же модель, которую валидирует backend;
- JSON mode обязан поддерживать round-trip с visual mode;
- неизвестные или неподдерживаемые настройки не должны молча теряться;
- advanced overrides доступны только как расширенный механизм, не как основа MVP.
- Zod/runtime validation слой добавляется отдельной задачей `MVP-05`; `MVP-04` ограничивается JSON Schema, default config, fixtures и минимальным schema validation helper.

Top-level поля:

- `version` - semver-like версия конфигурации;
- `meta` - необязательные сведения о preset/config: name, description, locale, author, createdAt, updatedAt;
- `input` - Markdown profile и политики обработки HTML, unsupported nodes и invalid XML chars;
- `document` - page size, orientation, margins, columns и metadata;
- `defaults` - базовые paragraph/run/table/image defaults;
- `styles` - named styles для MVP Markdown elements;
- `numbering` - ordered/unordered list presets и nested levels;
- `headersFooters` - schema-level структура headers/footers для будущего R2;
- `advanced` - flags и строго ограниченный `ooxmlOverrides`.

Canonical units:

- поля с суффиксом `Twip` хранят DOCX twips;
- поля с суффиксом `HalfPt` хранят half-points;
- поля с суффиксом `Emu` хранят EMU;
- поля с суффиксом `Pct` хранят проценты с ограничениями schema.

По умолчанию schema запрещает неизвестные поля через `additionalProperties: false`. Исключения допустимы только при явной архитектурной причине. `advanced.ooxmlOverrides` в MVP описан как пустой объект с `additionalProperties: false`; его расширение относится к R3.

## Предупреждения и диагностика

Единая модель diagnostics должна поддерживать:

- `info`;
- `warning`;
- `error`.

Минимальные категории:

- `unsupported-markdown`;
- `unsupported-html`;
- `invalid-xml-character`;
- `fallback-style`;
- `config-validation`;
- `asset-processing`;
- `preview-fidelity`;

Каждое предупреждение должно содержать:

- стабильный код;
- severity;
- человекочитаемое сообщение на русском для UI;
- machine-readable metadata;
- source path или location, если доступно;
- рекомендацию, если она применима.

## API

MVP endpoints:

```text
POST /api/v1/convert
POST /api/v1/preview/html
POST /api/v1/configs/validate
GET  /api/v1/health
GET  /api/v1/ready
```

R2 endpoints:

```text
POST /api/v1/preview/docx
POST /api/v1/templates/import-docx
POST /api/v1/batch/convert
GET  /api/v1/jobs/:jobId
```

API layering:

```text
routes
  -> controllers
  -> application services
  -> package adapters/domain services
```

Route handlers отвечают только за HTTP-level работу: чтение request, вызов controller/service, формирование response.

## Preview

MVP:

- fast HTML docx-like preview из resolved model;
- page boxes;
- zoom;
- warnings о расхождениях preview/export;
- отображение результата без генерации DOCX на каждый ввод.

R2:

- accurate preview через `generate .docx -> render via docx-preview`;
- fallback DOCX->PDF допускается только как отдельная R2/R3 задача после оценки окружения;
- кэширование по hash входных данных.

## Безопасность

Минимальные требования:

- ограничение размера Markdown/upload файлов;
- allowlist расширений и MIME types;
- sanitization разрешенного HTML subset;
- запрет небезопасного raw HTML by default;
- rate limit для публичных endpoints;
- узкий CORS;
- cleanup временных файлов;
- отдельная политика обработки архивов DOCX template import в R2.

## Тестирование

Уровни тестирования:

- unit tests для `domain`, `config-schema`, `md-parser`, `style-engine`;
- adapter tests для `docx-adapter` и `html-preview`;
- golden tests для DOCX package structure;
- API integration tests;
- frontend component/integration tests;
- E2E smoke для основного сценария;
- visual regression tests для R3.

Базовые команды после создания skeleton:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm docker:build
```

## Нефункциональные требования

- TypeScript strict mode.
- Компилируемость каждого пакета.
- Документированные команды запуска и проверки.
- UI полностью на русском языке.
- Docker Compose запуск.
- Healthcheck endpoints.
- Отсутствие TODO без соответствующей задачи в `docs/TASKS.md`.

## Не входит в текущий архитектурный шаг

- создание frontend/backend кода;
- реализация Markdown parser;
- реализация Style Engine;
- генерация DOCX;
- HTML preview renderer;
- Dockerfile contents;
- API handlers;
- временные mock-решения.
