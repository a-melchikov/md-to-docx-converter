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

### Frontend Shell

`MVP-14` создаёт рабочий React/Vite shell приложения без бизнес-логики конвертации и без временного fake pipeline.

Основные зоны UI:

- `Редактор Markdown` - место для будущего editor/upload flow;
- `Предпросмотр` - page-like область под будущий результат `POST /api/v1/preview/html`;
- `Настройки` - каркас секций visual settings;
- `Предупреждения` - место для будущих diagnostics/warnings.

Frontend shell может хранить только локальное UI-состояние: markdown draft, выбранную вкладку настроек и placeholder zoom. Он не вызывает API, не запускает parser/style/docx/html-preview packages в браузере и не строит fake Markdown preview. Read-only значения из `@md-to-docx/config-schema.defaultConfig` допустимы только как отображение текущей базовой конфигурации.

Layout должен оставаться русскоязычным, responsive и доступным с клавиатуры: header, main, section/aside landmarks, доступные имена кнопок, label для editor control и сохранённые focus styles.

Будущие frontend задачи:

- `MVP-16` - visual style settings;
- `MVP-17` - JSON import/export;
- `MVP-18` - live preview integration;
- `MVP-19` - DOCX export integration;
- `MVP-20` - warnings panel.

### Markdown Input Flow

`MVP-15` добавляет frontend input flow для Markdown без backend upload endpoint и без запуска parser/preview/export pipeline в браузере.

Поток данных:

```text
manual input / file upload / drag and drop
  -> frontend MarkdownDocumentState
  -> future MVP-18 live preview
  -> future MVP-19 DOCX export
```

`MarkdownDocumentState` хранит:

- `content` - текущий Markdown-текст;
- `fileName` - имя загруженного файла, если источник upload;
- `lastUpdatedAt` - время последнего изменения;
- `source` - `manual`, `upload` или `example`.

Frontend validation выполняется до замены editor state:

- разрешён только один файл;
- разрешены расширения `.md`, `.markdown`, `.txt`;
- MIME type учитывается, но не является единственной проверкой;
- file size ограничен frontend limit;
- длина Markdown ограничена frontend limit;
- пустой файл возвращает русскоязычную ошибку;
- drag and drop использует тот же validation/read слой, что и file input.

Backend upload endpoint для Markdown не создаётся в MVP-15. В `MVP-18` и `MVP-19` Markdown будет отправляться в API как text payload, а backend всё равно обязан повторно применять input limits и request validation. Live preview и DOCX export реализуются отдельными задачами и используют уже подготовленный frontend Markdown state.

### Visual Style Settings

`MVP-16` добавляет визуальные формы настройки DOCX-стилей поверх общей модели `ConversionConfig` из `@md-to-docx/config-schema`.

Поток данных:

```text
Visual form input
  -> config state
  -> shared ConversionConfig model
  -> future preview/export flows
```

Frontend хранит config state в виде:

```text
ConfigState {
  config: ConversionConfig
  isDirty: boolean
  lastUpdatedAt?: string
}
```

Начальное состояние создаётся из `defaultConfig`. Изменения форм применяются immutable update helpers и меняют только соответствующий участок `config`: например, поля страницы обновляют `document.page.margin.*Twip`, настройки заголовков обновляют `styles.heading1..heading6`, настройки списков обновляют первый уровень `numbering`. Секции `version`, `meta`, `input`, `headersFooters`, `advanced` и unrelated styles не должны сбрасываться при изменении визуальных полей.

Пользователь видит понятные единицы:

- page margins, indents, cell padding - миллиметры;
- font sizes and spacing - points;
- colors - HEX без `#`;
- table width - percent or auto.

В `ConversionConfig` сохраняются canonical units schema: `Twip`, `HalfPoint`, `Pct` и HEX strings. Visual settings не создают отдельную config model и не требуют ручного JSON editing для базовой настройки.

JSON import/export остаётся отдельной задачей `MVP-17`. Live preview и DOCX export используют этот же config state в `MVP-18` и `MVP-19`; API calls, Markdown parsing, DOCX generation и fake preview pipeline не входят в `MVP-16`.

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

Runtime validation:

```text
unknown config
  -> validateConfig / parseConfig
  -> ConfigValidationResult / ConfigParseResult
  -> Diagnostic[]
```

`packages/config-schema` является единственным источником runtime validation. В MVP-05 validation строится на JSON Schema через Ajv Draft 2020-12; ошибки schema validation маппятся в общий `Diagnostic[]` из `packages/domain`. `apps/api` и `apps/web` не имеют собственных независимых схем, не копируют JSON Schema и не создают отдельные Zod-модели. Они импортируют `validateConfig`, `parseConfig`, `isValidConfig`, `defaultConfig` и `configJsonSchema` из `@md-to-docx/config-schema`.

JSON mode и visual UI должны использовать одну модель `ConversionConfig`. Endpoint `POST /api/v1/configs/validate` реализуется отдельно в `MVP-11`; текущий слой только предоставляет общий validation API для будущего API endpoint и frontend state.

## Markdown parser

`packages/md-parser` реализует MVP-парсинг Markdown и преобразует CommonMark/GFM в intermediate document model из `packages/domain`.

Pipeline:

```text
Markdown string
  -> unified/remark
  -> mdast
  -> intermediate document model
  -> diagnostics
```

Зависимости:

- `packages/md-parser -> packages/domain`;
- `packages/md-parser -> unified`;
- `packages/md-parser -> remark-parse`;
- `packages/md-parser -> remark-gfm`.

Пакет не зависит от:

- `apps/*`;
- `packages/style-engine`;
- `packages/docx-adapter`;
- `packages/html-preview`;
- React/Vite;
- Fastify/API runtime.

Parser поддерживает два профиля: `commonmark` и `commonmark-gfm`. Для `commonmark-gfm` подключается `remark-gfm`; для `commonmark` GFM-расширения не включаются. Результат всегда возвращается как `ParseMarkdownResult` с `document` и `diagnostics`, без обращения к frontend/backend слоям.

Raw HTML policy:

- `warn-and-skip` - HTML пропускается, создается warning diagnostic;
- `fallback-text` - HTML-теги удаляются безопасным plain-text fallback без DOM/API выполнения;
- `error` - создается error diagnostic, небезопасное преобразование не выполняется.

Unsupported node policy:

- `warn-and-skip` - node пропускается с warning diagnostic;
- `fallback-text` - parser пытается извлечь plain text и вставить его в document model;
- `error` - создается error diagnostic и сохраняется unsupported node marker.

Source mapping берется из `mdast.position` и переносится в собственные типы `SourceLocation` из `packages/domain`: file name, start/end line/column и offsets. Если position отсутствует, parser не падает и возвращает node без `source`.

## Style Engine

`packages/style-engine` применяет `ConversionConfig` к intermediate document model и возвращает единый resolved style model для будущих output adapters.

Pipeline:

```text
IntermediateDocument
  -> Style Engine
  -> ResolvedDocument + Diagnostic[]
  -> DOCX adapter / HTML preview adapter
```

Зависимости:

- `packages/style-engine -> packages/domain`;
- `packages/style-engine -> packages/config-schema`.

Пакет не зависит от:

- `docx`;
- `packages/docx-adapter`;
- `packages/html-preview`;
- `apps/*`;
- React/Vite;
- Fastify/API runtime.

Каскад стилей:

```text
defaults -> named style -> markdown mapping -> direct override
```

Правила каскада:

- более поздний уровень переопределяет более ранний;
- `undefined` не затирает уже resolved значение;
- named style выбирается по Markdown element mapping: `heading1..heading6`, `paragraph`, `inlineCode`, `codeBlock`, `table`, `tableCell`, `image` и другие MVP style keys;
- markdown mapping добавляет intrinsic overrides для Markdown semantics, например `strong -> bold`, `emphasis -> italic`, `strikethrough -> strike`;
- direct override допускается только как безопасно разобранный `attrs.style` intermediate node.

Resolved model хранится в `packages/domain` и не привязан к `docx` или CSS. Он содержит исходную структуру документа, source/path, resolved paragraph/run/table/image properties, border/shading, document page properties и numbering metadata. DOCX adapter и HTML preview adapter должны читать эту модель, а не повторять style resolution.

Fallback strategy:

- отсутствующий style key не прерывает обработку;
- некорректный style definition заменяется безопасным fallback;
- unsupported intermediate node сохраняется как resolved unsupported node;
- каждый fallback возвращает warning diagnostic с кодами `style.missing`, `style.invalid`, `style.fallback` или `style.unsupportedNode`.

Invalid XML character policy берется из `config.input.onInvalidXmlChar`:

- `warn-and-skip` - удалить недопустимый XML 1.0 control character и вернуть warning;
- `error` - удалить недопустимый символ, вернуть error diagnostic и сохранить source/path;
- `replace-uFFFD` - заменить символ на `U+FFFD` и вернуть warning.

Canonical units:

- `Twip`, `HalfPoint`, `Emu`, `Pct` берутся из `packages/domain`;
- numeric config fields с суффиксами `Twip`, `HalfPt`, `Emu`, `Pct` преобразуются в branded unit types на этапе style resolution;
- conversion helpers для pt/cm/mm/in/px/percent покрываются unit tests.

## DOCX adapter

`packages/docx-adapter` преобразует `ResolvedDocument` в `.docx` artifact через npm-пакет `docx`.

Pipeline:

```text
ResolvedDocument
  -> DOCX adapter
  -> .docx buffer + Diagnostic[]
```

Зависимости:

- `packages/docx-adapter -> packages/domain`;
- `packages/docx-adapter -> docx`.

Пакет не зависит от:

- `apps/api`;
- `apps/web`;
- Fastify/API runtime;
- React/Vite/browser DOM;
- Markdown parser;
- Style Engine implementation.

Правила генерации:

- adapter не вычисляет style cascade заново и читает только resolved style model;
- OOXML package создается через публичные классы `docx`: `Document`, `Paragraph`, `TextRun`, `Table`, `ImageRun`, `ExternalHyperlink`, `Packer`;
- `document.xml`, `styles.xml`, `numbering.xml` и relationships не собираются ручной конкатенацией XML-строк;
- fallback допускается только для неполной resolved model или unsupported nodes и сопровождается diagnostics.

Поддерживаемые MVP mappings:

- paragraph/heading/code block/blockquote/thematic break;
- text, strong, emphasis, strikethrough, inline code, hard/soft breaks;
- external links через relationship;
- ordered/unordered/nested lists через numbering config;
- tables, rows и cells;
- image block/inline image при наличии безопасно переданных binary assets или поддержанного data URI.

Assets strategy:

- adapter не скачивает изображения по URL;
- adapter не читает локальные файлы;
- adapter не принимает произвольные file paths как источник данных;
- binary assets передаются только через `GenerateDocxInput.assets`;
- image node может ссылаться на `assetId`; если asset отсутствует, adapter возвращает `docx.image.missingAsset` и использует alt-text fallback;
- для MVP поддерживаются PNG/JPEG; неподдержанный формат возвращает diagnostic и не прерывает генерацию.

Golden tests:

- DOCX открывается как ZIP;
- проверяется наличие `[Content_Types].xml`, `_rels/.rels`, `word/document.xml`, `word/_rels/document.xml.rels`, `word/styles.xml`, `word/numbering.xml`;
- для images проверяется наличие `word/media/*`;
- для links проверяется external hyperlink relationship;
- XML не сравнивается целиком, чтобы тесты не зависели от порядка атрибутов `docx`.

MVP limitations:

- типографика Word не считается пиксельно точной;
- floating images, comments, bookmarks, fields, footnotes/endnotes и advanced OOXML overrides остаются для R2/R3;
- image dimensions задаются безопасными defaults/resolved limits, без чтения размеров файла и без внешнего I/O.

## HTML preview adapter

`packages/html-preview` строит быстрый docx-like preview из `ResolvedDocument`, той же модели, которую использует DOCX adapter.

Pipeline:

```text
ResolvedDocument
  -> HTML preview adapter
  -> html + css + Diagnostic[]
```

Зависимости:

- `packages/html-preview -> packages/domain`.

Пакет не зависит от:

- raw Markdown;
- `docx`;
- Mammoth;
- `docx-preview`;
- React/Vite/browser DOM;
- Fastify/API runtime;
- `apps/*`.

Preview strategy:

- результат возвращается как serializable `{ html, css, diagnostics, metadata }`;
- page boxes строятся через `.md2docx-preview`, `.md2docx-page`, `.md2docx-page-content`;
- page size и margins берутся из resolved document properties;
- zoom применяется через CSS variable `--preview-zoom` и не меняет resolved values;
- typography, paragraph spacing, indentation, tables, lists, links, images, code и thematic breaks маппятся из resolved style properties в CSS;
- preview не является accurate Word renderer и не претендует на точное совпадение layout Microsoft Word.

Fast preview limitations:

- page breaks approximate;
- table layout approximate;
- image dimensions are approximate and use resolved limits/defaults;
- unsupported resolved nodes render fallback text and diagnostics;
- accurate preview через `docx-preview` или DOCX/PDF pipeline выносится в R2.

Security policy:

- пользовательский text/code/link text/alt/title/table content всегда HTML-экранируется;
- raw HTML из Markdown не исполняется и не вставляется как HTML;
- link/image URLs проходят allowlist protocol policy: `http:`, `https:`, `mailto:`, `tel:` и относительные ссылки;
- unsafe URL renderится как plain text/image placeholder и возвращает `preview.security.unsafeUrl`;
- escaping возвращает `preview.security.escapedHtml`, чтобы UI мог показать предупреждение.

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

### API Skeleton

`apps/api` реализует Fastify runtime как отдельное приложение без бизнес-логики в route handlers.

Структура слоёв:

```text
routes
  -> controllers
  -> services
  -> packages/*
```

Правило для handlers: route регистрирует HTTP method/path и вызывает controller; controller формирует HTTP-level ответ; service содержит минимальную application-level операцию. Интеграция с `packages/md-parser`, `packages/style-engine`, `packages/docx-adapter`, `packages/html-preview` и `packages/config-schema` добавляется только в соответствующих MVP-задачах.

App factory:

```text
buildApp(options?) -> Promise<FastifyInstance>
```

`buildApp()` регистрирует middleware/plugins/routes, но не вызывает `listen()`. Сервер запускается отдельно из `apps/api/src/index.ts`, поэтому tests используют `buildApp()` через `app.inject()` без открытия порта.

Подключённые middleware/plugins:

- request-id: принимает `x-request-id` или генерирует новый request id, добавляет его в response header и logger context;
- logging: Fastify/Pino logger с редактированием sensitive headers, без логирования multipart body;
- CORS: origin берётся из env, local default `http://localhost:5173`, wildcard запрещён для production;
- rate limit: `@fastify/rate-limit`, лимиты берутся из env;
- multipart: `@fastify/multipart`, включены только size/files/fields limits без upload handling;
- sensible: базовые HTTP helpers Fastify.

`GET /api/v1/health` и `GET /api/v1/ready` являются единственными рабочими endpoints в `MVP-10`. Endpoint-ы `POST /api/v1/configs/validate`, `POST /api/v1/preview/html` и `POST /api/v1/convert` реализуются отдельно в `MVP-11`, `MVP-12` и `MVP-13`.

### API Config Validation Endpoint

`POST /api/v1/configs/validate` валидирует JSON-конфигурацию Markdown -> DOCX через общий runtime validation слой `@md-to-docx/config-schema`.

Flow:

```text
HTTP JSON request
  -> route
  -> controller
  -> config-validation service
  -> @md-to-docx/config-schema.validateConfig()
  -> Diagnostic[]
  -> HTTP response
```

Route отвечает только за HTTP-level contract: путь, метод, JSON content type и передачу управления controller. Controller вызывает service и маппит результат в response DTO. Service является единственным местом в `apps/api`, которое импортирует `validateConfig()`.

Правила валидации не дублируются в `apps/api`: JSON Schema, Ajv validator, diagnostic mapping и config typing остаются в `packages/config-schema`. Невалидная пользовательская конфигурация возвращает `200` с `{ valid: false, diagnostics }`; malformed JSON возвращает `400`, unsupported content type возвращает `415`.

Будущий frontend JSON mode должен использовать этот endpoint для серверной проверки конфигурации и подсветки ошибок по `Diagnostic.path`. Endpoint-ы `POST /api/v1/preview/html` и `POST /api/v1/convert` остаются отдельными задачами `MVP-12` и `MVP-13`.

### API HTML Preview Endpoint

`POST /api/v1/preview/html` строит fast DOCX-like HTML preview из Markdown и конфигурации через уже реализованные packages.

Pipeline:

```text
HTTP JSON request
  -> request DTO validation / input limits
  -> @md-to-docx/config-schema.validateConfig()
  -> @md-to-docx/md-parser.parseMarkdown()
  -> @md-to-docx/style-engine.resolveStyles()
  -> @md-to-docx/html-preview.renderHtmlPreview()
  -> html + css + metadata + Diagnostic[]
  -> HTTP response
```

Route отвечает за `POST /api/v1/preview/html`, JSON content type и body limit. Controller вызывает preview service и возвращает DTO. Service оркестрирует pipeline; route/controller не содержат parsing, style resolving или rendering logic.

Input limits применяются до Markdown parsing:

- `markdown` обязателен и ограничен `MAX_MARKDOWN_CHARS`;
- `fileName` ограничен длиной;
- `options.zoom` ограничен диапазоном `0.25..3`;
- route-level JSON body limit ограничивает размер request body.

Endpoint не генерирует DOCX, не использует Mammoth, не использует `docx-preview` и не выполняет raw HTML. HTML escaping и unsafe URL handling выполняются в `packages/html-preview`; API не вставляет дополнительный пользовательский HTML поверх adapter output.

Response объединяет diagnostics из request validation, config validation, Markdown parser, Style Engine и HTML preview adapter. Невалидная конфигурация возвращает diagnostics и не запускает Markdown parser. Frontend live preview integration остаётся отдельной задачей `MVP-18`.

### API DOCX Convert Endpoint

`POST /api/v1/convert` выполняет полный Markdown -> DOCX pipeline и возвращает бинарный `.docx` artifact.

Pipeline:

```text
HTTP JSON request
  -> request DTO validation / input limits
  -> @md-to-docx/config-schema.validateConfig()
  -> @md-to-docx/md-parser.parseMarkdown()
  -> @md-to-docx/style-engine.resolveStyles()
  -> @md-to-docx/docx-adapter.generateDocx()
  -> DOCX binary response
```

Route отвечает за `POST /api/v1/convert`, JSON content type и body limit. Controller выбирает HTTP response shape: binary DOCX для успешной конвертации или JSON error для ожидаемых пользовательских ошибок. Service оркестрирует pipeline; handler не содержит parser/style/DOCX business logic.

Успешный response:

- `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`;
- `Content-Disposition: attachment; filename="...docx"; filename*=UTF-8''...`;
- `X-MD2DOCX-Diagnostics: <base64url-json>`;
- body содержит DOCX binary.

Diagnostics header содержит JSON вида `{ diagnostics: Diagnostic[] }`, закодированный base64url. Если header становится слишком большим, API оставляет первые diagnostics и добавляет `truncated: true` и `total`.

Input limits применяются до Markdown parsing:

- `markdown` обязателен и ограничен `MAX_CONVERT_MARKDOWN_CHARS`;
- route-level JSON body limit ограничивает request body;
- `options.fileName` ограничен длиной;
- `assets` в MVP принимается только как отсутствующий или пустой JSON object.

Filename policy:

- trim;
- path separators `/` и `\` используются только для выбора последнего сегмента;
- control chars удаляются;
- `..` удаляется;
- опасные символы `:"*?<>|` заменяются;
- если имя пустое, используется `document.docx`;
- если расширение `.md`/`.markdown`, оно заменяется на `.docx`;
- `.docx` гарантируется всегда.

Endpoint не скачивает external assets, не читает локальные file paths из Markdown и не реализует frontend export flow. Если Markdown содержит image без binary asset, `packages/docx-adapter` возвращает warning diagnostic и безопасный alt-text fallback. Frontend DOCX export integration остаётся отдельной задачей `MVP-19`.

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
