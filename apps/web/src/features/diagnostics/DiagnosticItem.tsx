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
      <p className="diagnostics-item-explanation">{item.explanation}</p>
      <div className="diagnostics-item-context">
        <span>Раздел: {item.category}</span>
        {item.locationLabel ? <span>Где: {item.locationLabel}</span> : null}
      </div>
      <p className="diagnostics-item-action">
        <strong>Что сделать:</strong> {item.recommendation}
      </p>
      <details className="diagnostics-technical-details">
        <summary>Технические детали</summary>
        <dl>
          <div>
            <dt>Код</dt>
            <dd>{item.code}</dd>
          </div>
          <div>
            <dt>Источник</dt>
            <dd>{item.sourceName}</dd>
          </div>
          {item.path ? (
            <div>
              <dt>Путь</dt>
              <dd>{item.path}</dd>
            </div>
          ) : null}
          {item.sourceLocation ? (
            <div>
              <dt>Расположение</dt>
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
