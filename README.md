# md-to-docx-converter

Веб-приложение для конвертации Markdown в DOCX с визуальной настройкой стилей, предпросмотром результата и импортом/экспортом JSON-конфигураций.

## Цель проекта

Сделать удобный инструмент, который позволяет преобразовывать Markdown-документы в DOCX без ручного форматирования в Microsoft Word или LibreOffice.

## Основные возможности

* Конвертация Markdown в DOCX.
* Визуальная настройка оформления через UI.
* Поддержка JSON-конфигураций.
* Импорт и экспорт настроек конвертации.
* Предварительный просмотр результата.
* Предупреждения о неподдерживаемых элементах Markdown и неконвертируемых символах.
* Запуск через Docker.

## Планируемая архитектура

```text
apps/
  web/        frontend на React + TypeScript
  api/        backend на Node.js + TypeScript + Fastify

packages/
  domain/          общая доменная модель
  config-schema/   JSON Schema и типы конфигурации
  md-parser/       Markdown parser
  style-engine/    движок применения стилей
  docx-adapter/    генерация DOCX
  html-preview/    HTML preview

infra/
  docker/      Dockerfile-файлы
  nginx/       nginx reverse proxy
```

## Документация

Основная спецификация проекта находится в файле:

```text
docs/PROJECT_SPEC.md
```

Этот файл является главным источником требований для проектирования и реализации.

## Monorepo skeleton

Текущий skeleton использует `pnpm` и TypeScript strict mode.

Команды проверки skeleton:

```text
pnpm install
pnpm -r exec pwd
pnpm typecheck
pnpm build
```

На этапе skeleton `apps/web`, `apps/api` и `packages/*` содержат только минимальные TypeScript entrypoints. Реализация frontend, backend, Markdown parsing, Style Engine, DOCX generation, preview и Docker/nginx deployment выполняется отдельными задачами из `docs/TASKS.md`.

## Статус

Проект находится на этапе проектирования и начальной реализации.
