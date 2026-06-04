import { tableWidthModeOptions, type TableWidthMode } from "./form-options.js";
import {
  CheckboxField,
  HexColorField,
  NumberField,
  SelectField
} from "./fields.js";
import {
  borderStyleFromEnabled,
  millimetersToTwip,
  setTableWidthAuto,
  twipToMillimeters,
  updateDefaultTable,
  updateTableHeaderBold
} from "./config-update.js";
import type { StyleSettingsFormProps } from "./types.js";

export function TableSettingsForm({
  config,
  updateConfig
}: StyleSettingsFormProps) {
  const table = config.defaults.table;
  const widthMode: TableWidthMode =
    table.widthPct === undefined ? "auto" : "percent";

  return (
    <fieldset className="settings-form">
      <legend>Таблицы</legend>
      <SelectField
        label="Режим ширины таблицы"
        options={tableWidthModeOptions}
        value={widthMode}
        onChange={(mode) =>
          updateConfig((current) =>
            mode === "auto"
              ? setTableWidthAuto(current)
              : updateDefaultTable(current, { widthPct: table.widthPct ?? 100 })
          )
        }
      />
      <NumberField
        errorMessage="Процент должен быть от 0 до 100."
        label="Ширина таблицы, %"
        max={100}
        min={0}
        step={1}
        unitLabel="%"
        value={table.widthPct ?? 100}
        onValidChange={(value) =>
          updateConfig((current) => updateDefaultTable(current, { widthPct: value }))
        }
      />
      <CheckboxField
        checked={table.border?.style !== "none"}
        label="Граница таблицы"
        onChange={(checked) =>
          updateConfig((current) =>
            updateDefaultTable(current, {
              border: {
                ...current.defaults.table.border,
                style: borderStyleFromEnabled(checked)
              }
            })
          )
        }
      />
      <HexColorField
        label="Цвет границы таблицы, HEX"
        value={table.border?.color ?? "000000"}
        onValidChange={(color) =>
          updateConfig((current) =>
            updateDefaultTable(current, {
              border: { ...current.defaults.table.border, color }
            })
          )
        }
      />
      <CheckboxField
        checked={config.styles.tableHeader.run?.bold ?? false}
        label="Жирный заголовок таблицы"
        onChange={(checked) =>
          updateConfig((current) => updateTableHeaderBold(current, checked))
        }
      />
      <NumberField
        errorMessage="Отступ ячейки не может быть отрицательным."
        label="Отступ ячейки, мм"
        min={0}
        step={1}
        unitLabel="мм"
        value={twipToMillimeters(table.cellMarginTwip)}
        onValidChange={(value) =>
          updateConfig((current) =>
            updateDefaultTable(current, {
              cellMarginTwip: millimetersToTwip(value)
            })
          )
        }
      />
    </fieldset>
  );
}
