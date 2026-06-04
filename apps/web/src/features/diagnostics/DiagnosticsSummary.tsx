import type { DiagnosticsSummary as DiagnosticsSummaryModel } from "./diagnostics-grouping.js";

export interface DiagnosticsSummaryProps {
  readonly summary: DiagnosticsSummaryModel;
}

export function DiagnosticsSummary({ summary }: DiagnosticsSummaryProps) {
  const status = summaryStatus(summary);

  return (
    <div className={`diagnostics-summary ${status.tone}`} role="status">
      <div>
        <strong>{status.title}</strong>
        <p>{status.description}</p>
      </div>
      <div
        aria-label={`Сводка diagnostics: ошибок ${summary.error}, предупреждений ${summary.warning}, информационных сообщений ${summary.info}`}
        className="diagnostics-counts"
      >
        <span>{formatCount(summary.error, ["ошибка", "ошибки", "ошибок"])}</span>
        <span>
          {formatCount(summary.warning, [
            "предупреждение",
            "предупреждения",
            "предупреждений"
          ])}
        </span>
        <span>
          {formatCount(summary.info, [
            "информационное",
            "информационных",
            "информационных"
          ])}
        </span>
      </div>
    </div>
  );
}

function formatCount(
  count: number,
  forms: readonly [string, string, string]
): string {
  const mod100 = count % 100;
  const mod10 = count % 10;

  if (mod100 >= 11 && mod100 <= 14) {
    return `${count} ${forms[2]}`;
  }

  if (mod10 === 1) {
    return `${count} ${forms[0]}`;
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return `${count} ${forms[1]}`;
  }

  return `${count} ${forms[2]}`;
}

function summaryStatus(summary: DiagnosticsSummaryModel): {
  readonly title: string;
  readonly description: string;
  readonly tone: string;
} {
  if (summary.error > 0) {
    return {
      title: "Есть ошибки",
      description: "Исправьте ошибки перед экспортом DOCX.",
      tone: "error"
    };
  }

  if (summary.warning > 0) {
    return {
      title: "Есть предупреждения",
      description:
        "Документ можно экспортировать, но некоторые элементы могут отличаться в DOCX.",
      tone: "warning"
    };
  }

  return {
    title: "Ошибок и предупреждений нет",
    description: "Документ готов к экспорту.",
    tone: "success"
  };
}
