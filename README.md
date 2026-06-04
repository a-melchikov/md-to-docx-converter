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

## Локальная разработка без Docker

Monorepo использует `pnpm` и TypeScript strict mode.

Команды проверки:

```text
pnpm install
pnpm -r exec pwd
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Dev-команды пакетов:

```text
pnpm --filter @md-to-docx/api dev
pnpm --filter @md-to-docx/web dev
```

Если frontend запускается напрямую через Vite без nginx, задайте API base URL явно:

```bash
VITE_API_BASE_URL=http://localhost:8080 pnpm --filter @md-to-docx/web dev
```

Для обычного запуска приложения предпочтителен Docker Compose, потому что он поднимает frontend, backend и nginx в согласованной топологии.

## Production-like запуск через Docker

Production-like режим собирает frontend и backend внутри контейнеров. Локальный Node.js для запуска не нужен.

```bash
docker compose build
docker compose up -d
docker compose ps
curl -fsS http://localhost/api/v1/health
```

Открыть приложение:

```text
http://localhost
```

Логи:

```bash
docker compose logs -f api
docker compose logs -f nginx
```

Остановка:

```bash
docker compose down
```

## Dev запуск через Docker

Dev режим запускает Vite dev server и Fastify API watch mode внутри контейнеров. Исходники `apps/web`, `apps/api` и `packages/*` монтируются через volumes; локальный Node.js и локальный `pnpm install` на host не требуются.

```bash
docker compose -f docker-compose.dev.yml up --build
```

Открыть приложение:

```text
http://localhost
```

Проверить API через nginx:

```bash
curl -fsS http://localhost/api/v1/health
```

Логи:

```bash
docker compose -f docker-compose.dev.yml logs -f api-dev
docker compose -f docker-compose.dev.yml logs -f web-dev
docker compose -f docker-compose.dev.yml logs -f nginx-dev
```

Остановка:

```bash
docker compose -f docker-compose.dev.yml down
```

Если порт `80` занят, задайте другой порт для nginx:

```bash
NGINX_PORT=8088 docker compose -f docker-compose.dev.yml up --build
```

## Статус

Проект находится на этапе проектирования и начальной реализации.
