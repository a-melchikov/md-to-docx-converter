import { fontFamilyOptions } from "./form-options.js";
import { CheckboxField, HexColorField, NumberField, SelectField } from "./fields.js";
import {
  halfPointsToPoints,
  pointsToHalfPoints,
  updateDefaultRun
} from "./config-update.js";
import type { StyleSettingsFormProps } from "./types.js";

export function FontSettingsForm({
  config,
  updateConfig
}: StyleSettingsFormProps) {
  const run = config.defaults.run;

  return (
    <fieldset className="settings-form">
      <legend>Шрифты</legend>
      <SelectField
        label="Семейство шрифта"
        options={fontFamilyOptions.map((font) => ({ label: font, value: font }))}
        value={run.font?.ascii ?? "Times New Roman"}
        onChange={(font) =>
          updateConfig((current) =>
            updateDefaultRun(current, {
              font: { ascii: font, hAnsi: font, cs: font, eastAsia: font }
            })
          )
        }
      />
      <NumberField
        errorMessage="Размер шрифта должен быть больше 0."
        label="Размер шрифта, pt"
        requiredPositive
        step={0.5}
        unitLabel="pt"
        value={halfPointsToPoints(run.sizeHalfPt)}
        onValidChange={(value) =>
          updateConfig((current) =>
            updateDefaultRun(current, { sizeHalfPt: pointsToHalfPoints(value) })
          )
        }
      />
      <CheckboxField
        checked={run.bold ?? false}
        label="Жирный текст"
        onChange={(checked) =>
          updateConfig((current) => updateDefaultRun(current, { bold: checked }))
        }
      />
      <CheckboxField
        checked={run.italic ?? false}
        label="Курсив"
        onChange={(checked) =>
          updateConfig((current) => updateDefaultRun(current, { italic: checked }))
        }
      />
      <CheckboxField
        checked={run.underline === "single"}
        label="Подчёркивание"
        onChange={(checked) =>
          updateConfig((current) =>
            updateDefaultRun(current, { underline: checked ? "single" : "none" })
          )
        }
      />
      <HexColorField
        label="Цвет текста, HEX"
        value={run.color ?? "000000"}
        onValidChange={(color) =>
          updateConfig((current) => updateDefaultRun(current, { color }))
        }
      />
    </fieldset>
  );
}
