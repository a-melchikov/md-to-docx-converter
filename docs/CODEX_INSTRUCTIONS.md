# Codex instructions

## Основное правило

Не реализовывать всё приложение одним большим изменением.

Проект нужно делать поэтапно:

1. Анализ требований.
2. Архитектурный план.
3. Monorepo skeleton.
4. Backend MVP.
5. Frontend MVP.
6. DOCX generation.
7. Preview.
8. Docker/deploy.
9. Tests.
10. Расширенные возможности.

## Главные документы

Использовать как основные источники:

```text
docs/PROJECT_SPEC.md
docs/PROJECT_BRIEF.md
docs/COMMIT_CONVENTION.md
```

`docs/COMMIT_CONVENTION.md` описывает правила именования и выполнения коммитов. Если Codex делает commit или предлагает commit message, нужно использовать этот файл как обязательный источник правил.

## Ограничения

* Не добавлять бизнес-логику в route handlers.
* Не смешивать frontend, backend и infra в одном неструктурированном изменении.
* Не использовать временные mock-решения как основу архитектуры.
* Не генерировать DOCX вручную через конкатенацию XML-строк.
* Не использовать Mammoth как основной механизм точного preview.
* Не делать JSON единственным способом настройки.
* Не оставлять TODO без задачи в `docs/TASKS.md`.

## Требования к реализации

* TypeScript везде.
* Monorepo.
* Package manager: pnpm.
* Backend: Node.js + Fastify.
* Frontend: React + Vite.
* Markdown parser: unified/remark.
* DOCX generation: docx npm package.
* Config validation: JSON Schema + Zod.
* Docker Compose для запуска.
* UI на русском языке.

## Требования к качеству

* Код должен компилироваться.
* Должны быть базовые unit tests.
* Должны быть healthcheck endpoints.
* Должна быть понятная структура каталогов.
* Каждое крупное изменение должно сопровождаться описанием:

  * что изменено;
  * как запустить;
  * как проверить;
  * какие ограничения остались.
