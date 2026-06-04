import type { DiagnosticViewModel } from "./diagnostics-view-model.js";

export interface DiagnosticItemProps {
  readonly item: DiagnosticViewModel;
}

export function DiagnosticItem({ item }: DiagnosticItemProps) {
  return (
    <li className={`diagnostics-item severity-${item.severity}`}>
      <div className="diagnostics-item-main">
        <span className={`diagnostic-severity severity-${item.severity}`}>
          {item.severityLabel}
        </span>
        <span className="diagnostics-item-message">{item.message}</span>
      </div>
      <div className="diagnostics-item-context">
        <span>Категория: {item.category}</span>
        <span>Источник: {item.sourceName}</span>
        {item.path ? <span>Путь: {item.path}</span> : null}
        {item.sourceLocation ? <span>{item.sourceLocation}</span> : null}
      </div>
      <details className="diagnostics-technical-details">
        <summary>Технические детали</summary>
        <dl>
          <div>
            <dt>Код</dt>
            <dd>{item.code}</dd>
          </div>
          {item.path ? (
            <div>
              <dt>Путь</dt>
              <dd>{item.path}</dd>
            </div>
          ) : null}
          {item.sourceLocation ? (
            <div>
              <dt>Источник</dt>
              <dd>{item.sourceLocation}</dd>
            </div>
          ) : null}
          {item.metadata ? (
            <div>
              <dt>Metadata</dt>
              <dd>
                <pre>{JSON.stringify(item.metadata, null, 2)}</pre>
              </dd>
            </div>
          ) : null}
        </dl>
      </details>
    </li>
  );
}
