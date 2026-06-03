# Project brief

## Проект

`md-to-docx-converter`

## Цель

Веб-приложение для конвертации Markdown в DOCX с визуальной настройкой стилей, предварительным просмотром результата и импортом/экспортом настроек конвертации.

## Главный источник требований

Основная спецификация проекта находится в файле:

```text
docs/PROJECT_SPEC.md
```

Codex должен использовать этот файл как главный источник требований.

## Ключевые требования

1. Приложение должно состоять из frontend и backend.
2. Frontend должен быть написан на React + TypeScript.
3. Backend должен быть написан на Node.js + TypeScript + Fastify.
4. Проект должен быть оформлен как monorepo.
5. Запуск должен выполняться через Docker Compose.
6. UI должен быть полностью на русском языке.
7. Настройки форматирования DOCX должны задаваться через удобный визуальный интерфейс.
8. JSON должен использоваться для импорта/экспорта настроек, но не должен быть основным способом настройки для пользователя.
9. Должен быть live preview результата.
10. Должна быть система предупреждений:

    * неподдерживаемый Markdown;
    * неконвертируемые символы;
    * fallback-стили;
    * ошибки конфигурации.
11. Конвертация должна строиться через единый pipeline:

    * Markdown;
    * AST;
    * intermediate document model;
    * style engine;
    * DOCX adapter;
    * HTML preview adapter.

## Приоритет реализации

### MVP

* Monorepo skeleton.
* Backend API.
* Frontend UI.
* Markdown parser.
* Базовый Style Engine.
* DOCX export.
* HTML preview.
* JSON import/export.
* Docker Compose.

### R2

* Более точный preview через DOCX rendering.
* Импорт DOCX-шаблонов.
* Headers/footers.
* Page numbers.
* Batch conversion.
* API token.

### R3

* Plugin architecture.
* Advanced OOXML overrides.
* Comments/bookmarks/fields.
* Floating images.
* Visual regression tests.
