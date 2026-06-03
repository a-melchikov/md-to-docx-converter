# Commit convention

Проект использует Conventional Commits.

## Формат

```text
<type>(<scope>): <description>
```

`scope` необязателен, но рекомендуется.

Примеры:

```text
chore(repo): initialize pnpm workspace
feat(api): add health endpoints
feat(web): add initial Vite app
docs(project): add architecture documentation
infra(docker): add docker compose configuration
test(api): add health endpoint tests
refactor(parser): extract markdown parser interface
fix(config): validate missing style settings
```

## Разрешённые type

* `feat` — новая функциональность.
* `fix` — исправление ошибки.
* `docs` — документация.
* `chore` — технические изменения без изменения логики.
* `infra` — Docker, nginx, deploy, окружение.
* `ci` — GitHub Actions и CI/CD.
* `test` — тесты.
* `refactor` — рефакторинг без изменения поведения.
* `build` — сборка, зависимости, workspace.
* `style` — форматирование кода без изменения логики.
* `perf` — оптимизация производительности.
* `revert` — откат изменений.

## Scope

Рекомендуемые scope:

* `repo`
* `api`
* `web`
* `domain`
* `config-schema`
* `md-parser`
* `style-engine`
* `docx-adapter`
* `html-preview`
* `docker`
* `nginx`
* `docs`
* `ci`

## Правила

1. Один коммит должен соответствовать одной логической задаче.
2. Не смешивать frontend, backend, infra и docs в одном коммите, если это не единая задача.
3. Не делать коммит, если проект не компилируется.
4. Перед коммитом запускать доступные проверки.
5. Если проверку невозможно выполнить из-за окружения, указать это в итоговом отчёте.
6. Сообщение коммита должно быть коротким и понятным.
7. Описание писать в нижнем регистре без точки в конце.

## Когда делать commit

Codex должен делать commit после завершения задачи, если:

* изменения соответствуют scope задачи;
* проверки выполнены или явно описано, почему они не были выполнены;
* нет лишних временных файлов;
* изменения не выходят за рамки задачи.

## Когда не делать commit

Не делать commit, если:

* задача не завершена;
* есть ошибки компиляции;
* есть случайные временные файлы;
* изменения выходят за scope;
* пользователь явно попросил не коммитить.
