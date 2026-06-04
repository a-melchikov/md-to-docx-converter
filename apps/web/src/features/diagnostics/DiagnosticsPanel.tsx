import { useMemo, useState } from "react";

import {
  buildDiagnosticViewModels,
  filterDiagnostics,
  groupDiagnostics,
  summarizeDiagnostics,
  type DiagnosticsFilter
} from "./diagnostics-grouping.js";
import type { DiagnosticSourceInput } from "./diagnostics-source.js";
import { DiagnosticsGroup } from "./DiagnosticsGroup.js";
import { DiagnosticsSummary } from "./DiagnosticsSummary.js";

export interface DiagnosticsPanelProps {
  readonly sources: readonly DiagnosticSourceInput[];
}

const filters: readonly {
  readonly label: string;
  readonly value: DiagnosticsFilter;
}[] = [
  { label: "Все", value: "all" },
  { label: "Ошибки", value: "error" },
  { label: "Предупреждения", value: "warning" },
  { label: "Информация", value: "info" }
];

export function DiagnosticsPanel({ sources }: DiagnosticsPanelProps) {
  const [filter, setFilter] = useState<DiagnosticsFilter>("all");
  const items = useMemo(() => buildDiagnosticViewModels(sources), [sources]);
  const summary = useMemo(() => summarizeDiagnostics(items), [items]);
  const filteredItems = useMemo(
    () => filterDiagnostics(items, filter),
    [filter, items]
  );
  const groups = useMemo(() => groupDiagnostics(filteredItems), [filteredItems]);

  return (
    <>
      <div className="panel-heading">
        <div>
          <p className="panel-label">Диагностика</p>
          <h2 id="warnings-heading">Предупреждения и ошибки</h2>
        </div>
        <span className="panel-status">{summary.total}</span>
      </div>

      <DiagnosticsSummary summary={summary} />

      <div
        aria-label="Фильтр diagnostics"
        className="diagnostics-filters"
        role="group"
      >
        {filters.map((candidate) => (
          <button
            aria-pressed={filter === candidate.value}
            className="secondary-button"
            key={candidate.value}
            type="button"
            onClick={() => setFilter(candidate.value)}
          >
            {candidate.label}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="diagnostics-list">
        {groups.length === 0 ? (
          <div className="empty-warning-state" role="status">
            <strong>Ошибок и предупреждений нет</strong>
            <span>Diagnostics появятся здесь после проверки настроек, предпросмотра или экспорта.</span>
          </div>
        ) : (
          groups.map((group) => (
            <DiagnosticsGroup group={group} key={group.severity} />
          ))
        )}
      </div>
    </>
  );
}
