import type { DiagnosticsSummary as DiagnosticsSummaryModel } from "./diagnostics-grouping.js";

export interface DiagnosticsSummaryProps {
  readonly summary: DiagnosticsSummaryModel;
}

export function DiagnosticsSummary({ summary }: DiagnosticsSummaryProps) {
  return (
    <div
      aria-label={`Сводка diagnostics: ошибок ${summary.error}, предупреждений ${summary.warning}, информационных сообщений ${summary.info}`}
      className="diagnostics-summary"
    >
      <span>Ошибки: {summary.error}</span>
      <span>Предупреждения: {summary.warning}</span>
      <span>Информация: {summary.info}</span>
    </div>
  );
}
