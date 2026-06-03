# Tasks

## Правила выполнения задач

Каждая задача ниже должна быть достаточно малой для отдельного PR или отдельного коммита. Задачи не должны добавлять временные mock-решения как основу архитектуры. Если появляется TODO, он должен ссылаться на конкретную задачу из этого файла или быть заменен явным acceptance gap.

Базовые команды проверки после создания skeleton:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Команды с `--filter` предполагают package names:

```text
@md-to-docx/web
@md-to-docx/api
@md-to-docx/domain
@md-to-docx/config-schema
@md-to-docx/md-parser
@md-to-docx/style-engine
@md-to-docx/docx-adapter
@md-to-docx/html-preview
```

## MVP tasks

### MVP-01. Создать monorepo skeleton

Цель: подготовить структуру `apps`, `packages`, `infra`, root configs и workspace без бизнес-логики.

Затрагиваемые файлы/пакеты:

- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `apps/web/package.json`
- `apps/api/package.json`
- `packages/*/package.json`
- `infra/docker/`
- `infra/nginx/`
- `.env.example`
- `.gitignore`

Критерии готовности:

- все каталоги из `docs/ARCHITECTURE.md` созданы;
- `pnpm install` работает;
- workspace видит все apps/packages;
- placeholder-файлы не содержат бизнес-логику;
- README или docs содержат команды запуска skeleton.

Команды проверки:

```text
pnpm install
pnpm -r exec pwd
pnpm typecheck
pnpm build
```

### MVP-02. Настроить базовые quality scripts

Цель: добавить единые команды lint/typecheck/test/build для monorepo.

Затрагиваемые файлы/пакеты:

- root `package.json`
- `tsconfig.base.json`
- package-level `tsconfig.json`
- lint/test config files

Критерии готовности:

- root scripts запускают проверки по workspace;
- TypeScript strict mode включен;
- проверки работают даже при минимальном skeleton;
- нет зависимостей от несуществующей бизнес-логики.

Команды проверки:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### MVP-03. Описать доменную модель MVP

Цель: ввести типы intermediate document model, diagnostics и единиц измерения.

Затрагиваемые файлы/пакеты:

- `packages/domain`
- `docs/ARCHITECTURE.md`

Критерии готовности:

- типы покрывают MVP Markdown elements;
- diagnostics имеют severity, code, message, metadata и source location/path;
- unit-типы разделяют `twip`, `halfPt`, `emu`, `pct`;
- пакет не зависит от apps, React, Fastify или `docx`;
- unit tests покрывают базовые type guards/factories, если они есть.

Команды проверки:

```text
pnpm --filter @md-to-docx/domain typecheck
pnpm --filter @md-to-docx/domain test
pnpm lint
```

### MVP-04. Создать JSON Schema конфигурации MVP

Цель: описать переносимую конфигурацию конвертации в JSON Schema Draft 2020-12.

Затрагиваемые файлы/пакеты:

- `packages/config-schema`
- `packages/domain`

Критерии готовности:

- schema содержит `version`, `meta`, `input`, `document`, `defaults`, `styles`, `numbering`, `headersFooters`, `advanced`;
- schema запрещает неизвестные поля там, где это нужно для безопасности;
- есть валидный default config;
- есть invalid fixtures для config validation errors;
- поддержаны canonical units.

Команды проверки:

```text
pnpm --filter @md-to-docx/config-schema typecheck
pnpm --filter @md-to-docx/config-schema test
pnpm lint
```

### MVP-05. Добавить Zod/runtime validation слой

Цель: обеспечить runtime validation для API и frontend без расхождения с JSON Schema.

Затрагиваемые файлы/пакеты:

- `packages/config-schema`
- `apps/api`
- `apps/web`

Критерии готовности:

- Zod-схемы или generated validators соответствуют JSON Schema;
- validation возвращает diagnostics в общей модели;
- visual UI и JSON mode используют одну модель;
- нет дублирования несовместимых схем в web/api.

Команды проверки:

```text
pnpm --filter @md-to-docx/config-schema test
pnpm --filter @md-to-docx/api typecheck
pnpm --filter @md-to-docx/web typecheck
```

### MVP-06. Реализовать Markdown parser MVP

Цель: преобразовать Markdown CommonMark/GFM в intermediate document model.

Затрагиваемые файлы/пакеты:

- `packages/md-parser`
- `packages/domain`

Критерии готовности:

- используется `unified`, `remark-parse`, `remark-gfm`;
- поддержаны MVP elements из `docs/ROADMAP.md`;
- unsupported nodes возвращают diagnostics;
- raw HTML обрабатывается по policy без небезопасного выполнения;
- source mapping доступен для warnings.

Команды проверки:

```text
pnpm --filter @md-to-docx/md-parser test
pnpm --filter @md-to-docx/md-parser typecheck
pnpm lint
```

### MVP-07. Реализовать базовый Style Engine

Цель: применить конфигурацию к intermediate model и получить resolved style model.

Затрагиваемые файлы/пакеты:

- `packages/style-engine`
- `packages/domain`
- `packages/config-schema`

Критерии готовности:

- реализован каскад `defaults -> named style -> markdown mapping -> direct override`;
- unit conversions покрыты тестами;
- fallback styles создают diagnostics;
- invalid XML character policy поддерживает `warn-and-skip`, `error`, `replace-uFFFD`;
- результат пригоден для DOCX adapter и HTML preview.

Команды проверки:

```text
pnpm --filter @md-to-docx/style-engine test
pnpm --filter @md-to-docx/style-engine typecheck
pnpm lint
```

### MVP-08. Реализовать DOCX adapter MVP

Цель: генерировать DOCX через npm-пакет `docx` из resolved style model.

Затрагиваемые файлы/пакеты:

- `packages/docx-adapter`
- `packages/domain`

Критерии готовности:

- не используется ручная конкатенация XML;
- поддержаны paragraphs, headings, lists, links, images, tables, code, quotes;
- DOCX содержит ожидаемые document/styles/numbering/media relationships;
- golden tests проверяют структуру package parts;
- diagnostics пробрасываются наружу.

Команды проверки:

```text
pnpm --filter @md-to-docx/docx-adapter test
pnpm --filter @md-to-docx/docx-adapter typecheck
pnpm lint
```

### MVP-09. Реализовать HTML preview adapter MVP

Цель: построить fast docx-like preview из resolved style model.

Затрагиваемые файлы/пакеты:

- `packages/html-preview`
- `packages/domain`
- `apps/web`

Критерии готовности:

- preview строится из той же resolved model, что и DOCX export;
- есть page boxes, margins, zoom и базовые стили;
- warnings о fidelity limits доступны UI;
- нет зависимости от Mammoth как faithful preview.

Команды проверки:

```text
pnpm --filter @md-to-docx/html-preview test
pnpm --filter @md-to-docx/html-preview typecheck
pnpm --filter @md-to-docx/web typecheck
```

### MVP-10. Создать API skeleton и middleware

Цель: подготовить Fastify API без бизнес-логики в handlers.

Затрагиваемые файлы/пакеты:

- `apps/api`

Критерии готовности:

- есть app factory;
- подключены request-id/logging, CORS, rate limit, multipart limits;
- routes вызывают controllers/services;
- есть graceful shutdown;
- `/api/v1/health` и `/api/v1/ready` работают.

Команды проверки:

```text
pnpm --filter @md-to-docx/api test
pnpm --filter @md-to-docx/api typecheck
pnpm --filter @md-to-docx/api build
```

### MVP-11. Добавить API endpoint config validation

Цель: реализовать `POST /api/v1/configs/validate`.

Затрагиваемые файлы/пакеты:

- `apps/api`
- `packages/config-schema`
- `packages/domain`

Критерии готовности:

- endpoint валидирует JSON-конфигурацию;
- ошибки возвращаются в diagnostics model;
- handler не содержит validation logic напрямую;
- integration tests покрывают valid/invalid configs.

Команды проверки:

```text
pnpm --filter @md-to-docx/api test
pnpm --filter @md-to-docx/config-schema test
pnpm typecheck
```

### MVP-12. Добавить API endpoint HTML preview

Цель: реализовать `POST /api/v1/preview/html`.

Затрагиваемые файлы/пакеты:

- `apps/api`
- `packages/md-parser`
- `packages/style-engine`
- `packages/html-preview`

Критерии готовности:

- endpoint проходит полный pipeline до HTML preview;
- возвращает preview payload и diagnostics;
- input limits применяются до parsing;
- integration tests покрывают happy path и warnings.

Команды проверки:

```text
pnpm --filter @md-to-docx/api test
pnpm --filter @md-to-docx/html-preview test
pnpm typecheck
```

### MVP-13. Добавить API endpoint DOCX convert

Цель: реализовать `POST /api/v1/convert`.

Затрагиваемые файлы/пакеты:

- `apps/api`
- `packages/md-parser`
- `packages/style-engine`
- `packages/docx-adapter`

Критерии готовности:

- endpoint возвращает DOCX artifact;
- diagnostics доступны в response metadata или headers/sidecar payload по выбранному контракту;
- handler не содержит business logic;
- integration tests проверяют content type, filename и базовую DOCX structure.

Команды проверки:

```text
pnpm --filter @md-to-docx/api test
pnpm --filter @md-to-docx/docx-adapter test
pnpm typecheck
```

### MVP-14. Создать frontend shell

Цель: подготовить React/Vite приложение с базовым русским layout.

Затрагиваемые файлы/пакеты:

- `apps/web`
- `packages/domain`
- `packages/config-schema`

Критерии готовности:

- UI на русском языке;
- есть зоны editor, preview, settings, warnings;
- layout responsive;
- нет временного fake pipeline вместо API/packages;
- доступность базовых controls проверена тестами.

Команды проверки:

```text
pnpm --filter @md-to-docx/web test
pnpm --filter @md-to-docx/web typecheck
pnpm --filter @md-to-docx/web build
```

### MVP-15. Добавить Markdown editor и upload flow

Цель: дать пользователю ввод Markdown через editor и загрузку файла.

Затрагиваемые файлы/пакеты:

- `apps/web`
- `apps/api`

Критерии готовности:

- editor работает с Markdown text;
- upload проверяет размер и расширение;
- drag and drop не обходит validation;
- ошибки отображаются на русском;
- состояние editor участвует в preview/export flow.

Команды проверки:

```text
pnpm --filter @md-to-docx/web test
pnpm --filter @md-to-docx/api test
pnpm typecheck
```

### MVP-16. Добавить visual style settings

Цель: реализовать визуальную настройку базовых стилей DOCX.

Затрагиваемые файлы/пакеты:

- `apps/web`
- `packages/config-schema`
- `packages/domain`

Критерии готовности:

- пользователь может настроить document page, margins, fonts, headings, paragraph, lists, tables, code, quote;
- формы используют общую config model;
- UI не требует ручного JSON для базовой настройки;
- изменения обновляют config state без потери данных.

Команды проверки:

```text
pnpm --filter @md-to-docx/web test
pnpm --filter @md-to-docx/config-schema test
pnpm typecheck
```

### MVP-17. Добавить JSON import/export mode

Цель: обеспечить переносимость настроек через JSON.

Затрагиваемые файлы/пакеты:

- `apps/web`
- `packages/config-schema`

Критерии готовности:

- импорт JSON валидируется через общую schema;
- экспорт JSON сохраняет поддерживаемую структуру;
- visual mode и JSON mode поддерживают round-trip;
- validation errors показываются на русском.

Команды проверки:

```text
pnpm --filter @md-to-docx/web test
pnpm --filter @md-to-docx/config-schema test
pnpm typecheck
```

### MVP-18. Добавить live preview integration

Цель: связать frontend с `POST /api/v1/preview/html`.

Затрагиваемые файлы/пакеты:

- `apps/web`
- `apps/api`
- `packages/html-preview`

Критерии готовности:

- preview обновляется при изменении Markdown/config;
- есть debounce/cancellation;
- warnings отображаются рядом с preview;
- ошибки API не ломают editor state.

Команды проверки:

```text
pnpm --filter @md-to-docx/web test
pnpm --filter @md-to-docx/api test
pnpm typecheck
```

### MVP-19. Добавить DOCX export integration

Цель: связать frontend с `POST /api/v1/convert`.

Затрагиваемые файлы/пакеты:

- `apps/web`
- `apps/api`
- `packages/docx-adapter`

Критерии готовности:

- пользователь может скачать DOCX;
- имя файла стабильно и безопасно;
- warnings перед export не теряются;
- ошибки отображаются на русском.

Команды проверки:

```text
pnpm --filter @md-to-docx/web test
pnpm --filter @md-to-docx/api test
pnpm --filter @md-to-docx/docx-adapter test
pnpm typecheck
```

### MVP-20. Добавить warnings panel

Цель: отобразить diagnostics пользователю в едином UI.

Затрагиваемые файлы/пакеты:

- `apps/web`
- `packages/domain`

Критерии готовности:

- warnings/errors сгруппированы по severity/category;
- сообщения на русском;
- source location/path отображается, если есть;
- UI не использует только цвет как сигнал.

Команды проверки:

```text
pnpm --filter @md-to-docx/web test
pnpm --filter @md-to-docx/web typecheck
pnpm lint
```

### MVP-21. Добавить Docker Compose и nginx

Цель: подготовить production-like запуск через Docker Compose.

Затрагиваемые файлы/пакеты:

- `docker-compose.yml`
- `infra/docker/Dockerfile.api`
- `infra/docker/Dockerfile.web`
- `infra/nginx/nginx.conf`
- `.env.example`

Критерии готовности:

- multi-stage builds для web/api;
- nginx маршрутизирует frontend и `/api/*`;
- healthchecks настроены;
- temp/upload volumes описаны;
- запуск не требует локального Node вне контейнеров.

Команды проверки:

```text
docker compose build
docker compose up -d
docker compose ps
curl -fsS http://localhost/api/v1/health
docker compose down
```

### MVP-22. Добавить MVP smoke/e2e проверку

Цель: зафиксировать end-to-end сценарий MVP.

Затрагиваемые файлы/пакеты:

- `apps/web`
- `apps/api`
- `packages/*`
- test config files

Критерии готовности:

- сценарий: Markdown -> preview -> warnings -> DOCX download;
- тест проверяет русский UI;
- тест не зависит от временных mock-решений;
- CI может запускать smoke без ручных действий.

Команды проверки:

```text
pnpm test
pnpm build
pnpm e2e
```

### MVP-23. Обновить README после MVP

Цель: описать запуск, проверку и ограничения MVP.

Затрагиваемые файлы/пакеты:

- `README.md`
- `docs/ROADMAP.md`
- `docs/TASKS.md`

Критерии готовности:

- есть команды локального и Docker запуска;
- описаны поддерживаемые Markdown elements;
- описаны known limitations;
- нет обещаний R2/R3 как уже реализованных функций.

Команды проверки:

```text
pnpm lint
pnpm test
pnpm build
```

## R2 tasks

### R2-01. Добавить accurate preview endpoint

Цель: реализовать `POST /api/v1/preview/docx` через generate DOCX -> `docx-preview`.

Затрагиваемые файлы/пакеты:

- `apps/api`
- `apps/web`
- `packages/docx-adapter`

Критерии готовности:

- fast preview остается доступен;
- accurate preview имеет отдельный режим;
- fidelity limitations возвращаются как diagnostics;
- есть кэширование по hash входных данных.

Команды проверки:

```text
pnpm --filter @md-to-docx/api test
pnpm --filter @md-to-docx/web test
pnpm typecheck
```

### R2-02. Добавить DOCX template import

Цель: импортировать стили и numbering из `.docx` template.

Затрагиваемые файлы/пакеты:

- `apps/api`
- `packages/config-schema`
- `packages/docx-adapter`

Критерии готовности:

- endpoint `POST /api/v1/templates/import-docx` извлекает styles, numbering, theme metadata;
- обработка zip/package безопасна по лимитам;
- unsupported template parts возвращают warnings;
- импорт не ломает default config.

Команды проверки:

```text
pnpm --filter @md-to-docx/api test
pnpm --filter @md-to-docx/docx-adapter test
pnpm typecheck
```

### R2-03. Добавить headers/footers

Цель: поддержать headers/footers в config, UI, style engine и DOCX output.

Затрагиваемые файлы/пакеты:

- `packages/config-schema`
- `packages/domain`
- `packages/style-engine`
- `packages/docx-adapter`
- `packages/html-preview`
- `apps/web`

Критерии готовности:

- visual UI позволяет включить header/footer;
- JSON config валидирует header/footer;
- DOCX содержит соответствующие parts;
- fast preview показывает приближенный результат.

Команды проверки:

```text
pnpm --filter @md-to-docx/config-schema test
pnpm --filter @md-to-docx/docx-adapter test
pnpm --filter @md-to-docx/web test
pnpm typecheck
```

### R2-04. Добавить page numbers

Цель: поддержать номера страниц в footer/header.

Затрагиваемые файлы/пакеты:

- `packages/config-schema`
- `packages/domain`
- `packages/docx-adapter`
- `packages/html-preview`
- `apps/web`

Критерии готовности:

- UI на русском позволяет выбрать формат номера;
- DOCX использует field/page number mechanism через `docx`;
- preview показывает приближенный placeholder;
- limitations documented.

Команды проверки:

```text
pnpm --filter @md-to-docx/docx-adapter test
pnpm --filter @md-to-docx/html-preview test
pnpm --filter @md-to-docx/web test
```

### R2-05. Добавить batch conversion

Цель: реализовать пакетную конвертацию нескольких Markdown файлов.

Затрагиваемые файлы/пакеты:

- `apps/api`
- `apps/web`
- `packages/domain`

Критерии готовности:

- endpoint `POST /api/v1/batch/convert`;
- endpoint `GET /api/v1/jobs/:jobId`;
- есть ограничения размера/количества файлов;
- каждый item имеет собственные diagnostics;
- UI показывает статус batch job.

Команды проверки:

```text
pnpm --filter @md-to-docx/api test
pnpm --filter @md-to-docx/web test
pnpm typecheck
```

### R2-06. Добавить API token

Цель: защитить API endpoints для внешнего доступа.

Затрагиваемые файлы/пакеты:

- `apps/api`
- `.env.example`
- `docs/`

Критерии готовности:

- token проверяется middleware-слоем;
- health endpoint остается доступен по выбранной policy;
- секреты не попадают в frontend bundle;
- документация описывает настройку.

Команды проверки:

```text
pnpm --filter @md-to-docx/api test
pnpm --filter @md-to-docx/api typecheck
pnpm lint
```

### R2-07. Добавить versioning и migrations config

Цель: поддержать миграции конфигураций между версиями.

Затрагиваемые файлы/пакеты:

- `packages/config-schema`
- `apps/web`
- `apps/api`

Критерии готовности:

- old config fixtures мигрируют в текущую версию;
- migration diagnostics отображаются;
- экспорт всегда пишет текущую версию;
- несовместимые версии дают понятную ошибку.

Команды проверки:

```text
pnpm --filter @md-to-docx/config-schema test
pnpm --filter @md-to-docx/web test
pnpm --filter @md-to-docx/api test
```

## R3 tasks

### R3-01. Спроектировать plugin architecture

Цель: ввести контракт расширения pipeline без обхода validation и diagnostics.

Затрагиваемые файлы/пакеты:

- `packages/domain`
- `packages/md-parser`
- `packages/style-engine`
- `packages/docx-adapter`
- `docs/ARCHITECTURE.md`

Критерии готовности:

- описаны extension points;
- plugins не могут писать произвольный unsafe output без validation;
- есть тестовый plugin fixture;
- docs описывают ограничения.

Команды проверки:

```text
pnpm test
pnpm typecheck
pnpm lint
```

### R3-02. Добавить advanced OOXML overrides

Цель: разрешить контролируемые advanced-настройки OOXML.

Затрагиваемые файлы/пакеты:

- `packages/config-schema`
- `packages/style-engine`
- `packages/docx-adapter`
- `apps/web`

Критерии готовности:

- overrides валидируются schema;
- UI ясно отделяет advanced mode от basic visual settings;
- unsupported overrides возвращают diagnostics;
- нет ручной конкатенации XML.

Команды проверки:

```text
pnpm --filter @md-to-docx/config-schema test
pnpm --filter @md-to-docx/docx-adapter test
pnpm --filter @md-to-docx/web test
```

### R3-03. Добавить comments/bookmarks/fields

Цель: поддержать расширенные WordprocessingML constructs.

Затрагиваемые файлы/пакеты:

- `packages/domain`
- `packages/config-schema`
- `packages/style-engine`
- `packages/docx-adapter`
- `packages/html-preview`
- `apps/web`

Критерии готовности:

- comments/bookmarks/fields описаны в domain model;
- DOCX golden tests проверяют package parts;
- preview имеет graceful fallback;
- UI показывает ограничения.

Команды проверки:

```text
pnpm --filter @md-to-docx/docx-adapter test
pnpm --filter @md-to-docx/html-preview test
pnpm typecheck
```

### R3-04. Добавить floating images и wrap modes

Цель: поддержать floating images с ограниченным набором wrap modes.

Затрагиваемые файлы/пакеты:

- `packages/domain`
- `packages/config-schema`
- `packages/style-engine`
- `packages/docx-adapter`
- `packages/html-preview`
- `apps/web`

Критерии готовности:

- inline/floating image modes разделены;
- wrap modes валидируются;
- DOCX output покрыт golden tests;
- preview возвращает fidelity warnings при неточном отображении.

Команды проверки:

```text
pnpm --filter @md-to-docx/docx-adapter test
pnpm --filter @md-to-docx/html-preview test
pnpm --filter @md-to-docx/web test
```

### R3-05. Добавить visual regression tests

Цель: контролировать качество preview при изменениях.

Затрагиваемые файлы/пакеты:

- `apps/web`
- `packages/html-preview`
- test config files

Критерии готовности:

- есть baseline screenshots;
- тесты запускаются стабильно в CI;
- desktop и mobile viewports покрыты;
- flaky thresholds документированы.

Команды проверки:

```text
pnpm --filter @md-to-docx/web test:visual
pnpm --filter @md-to-docx/html-preview test
pnpm test
```

### R3-06. Расширить DOCX golden tests

Цель: защитить advanced DOCX behavior от регрессий.

Затрагиваемые файлы/пакеты:

- `packages/docx-adapter`
- `packages/style-engine`
- test fixtures

Критерии готовности:

- golden fixtures покрывают styles, numbering, relationships, headers/footers, comments/bookmarks/fields, images;
- тесты проверяют package structure, а не только наличие файла;
- обновление golden fixtures документировано.

Команды проверки:

```text
pnpm --filter @md-to-docx/docx-adapter test
pnpm --filter @md-to-docx/style-engine test
pnpm test
```

## Следующая задача после текущего документационного шага

Следующим PR/коммитом должен быть `MVP-01. Создать monorepo skeleton`.
