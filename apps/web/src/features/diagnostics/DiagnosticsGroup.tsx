import type { DiagnosticsSeverityGroup } from "./diagnostics-grouping.js";
import { severityGroupLabel } from "./diagnostics-view-model.js";
import { DiagnosticItem } from "./DiagnosticItem.js";

export interface DiagnosticsGroupProps {
  readonly group: DiagnosticsSeverityGroup;
}

export function DiagnosticsGroup({ group }: DiagnosticsGroupProps) {
  return (
    <section className="diagnostics-severity-group">
      <h3>{severityGroupLabel(group.severity)}</h3>
      {group.categories.map((category) => (
        <section className="diagnostics-category-group" key={category.category}>
          <h4>{category.category}</h4>
          <ul>
            {category.items.map((item) => (
              <DiagnosticItem item={item} key={item.id} />
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
