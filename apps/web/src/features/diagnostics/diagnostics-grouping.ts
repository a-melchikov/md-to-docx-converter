import type { DiagnosticSeverity } from "@md-to-docx/domain";

import type { DiagnosticSourceInput } from "./diagnostics-source.js";
import {
  diagnosticToViewModel,
  type DiagnosticViewModel
} from "./diagnostics-view-model.js";

export type DiagnosticsFilter = "all" | DiagnosticSeverity;

export interface DiagnosticsSummary {
  readonly error: number;
  readonly warning: number;
  readonly info: number;
  readonly total: number;
}

export interface DiagnosticsCategoryGroup {
  readonly category: string;
  readonly items: readonly DiagnosticViewModel[];
}

export interface DiagnosticsSeverityGroup {
  readonly severity: DiagnosticSeverity;
  readonly items: readonly DiagnosticViewModel[];
  readonly categories: readonly DiagnosticsCategoryGroup[];
}

export const severityOrder = ["error", "warning", "info"] as const;

export function buildDiagnosticViewModels(
  sources: readonly DiagnosticSourceInput[]
): readonly DiagnosticViewModel[] {
  return sources.flatMap((sourceInput) =>
    sourceInput.diagnostics.map((diagnostic, index) =>
      diagnosticToViewModel(diagnostic, sourceInput.source, index)
    )
  );
}

export function summarizeDiagnostics(
  items: readonly DiagnosticViewModel[]
): DiagnosticsSummary {
  return {
    error: items.filter((item) => item.severity === "error").length,
    warning: items.filter((item) => item.severity === "warning").length,
    info: items.filter((item) => item.severity === "info").length,
    total: items.length
  };
}

export function filterDiagnostics(
  items: readonly DiagnosticViewModel[],
  filter: DiagnosticsFilter
): readonly DiagnosticViewModel[] {
  return filter === "all"
    ? items
    : items.filter((item) => item.severity === filter);
}

export function groupDiagnostics(
  items: readonly DiagnosticViewModel[]
): readonly DiagnosticsSeverityGroup[] {
  return severityOrder
    .map((severity) => {
      const severityItems = items.filter((item) => item.severity === severity);
      return {
        severity,
        items: severityItems,
        categories: groupByCategory(severityItems)
      };
    })
    .filter((group) => group.items.length > 0);
}

function groupByCategory(
  items: readonly DiagnosticViewModel[]
): readonly DiagnosticsCategoryGroup[] {
  const categories = new Map<string, DiagnosticViewModel[]>();

  for (const item of items) {
    const existing = categories.get(item.category) ?? [];
    existing.push(item);
    categories.set(item.category, existing);
  }

  return [...categories.entries()].map(([category, categoryItems]) => ({
    category,
    items: categoryItems
  }));
}
