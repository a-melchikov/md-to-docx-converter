import type { LevelFormat } from "@md-to-docx/config-schema";

import { numberingFormatOptions } from "./form-options.js";
import { NumberField, SelectField, TextField } from "./fields.js";
import {
  levelTextForFormat,
  millimetersToTwip,
  twipToMillimeters,
  updateFirstNumberingLevel
} from "./config-update.js";
import type { StyleSettingsFormProps } from "./types.js";

export function ListSettingsForm({
  config,
  updateConfig
}: StyleSettingsFormProps) {
  const unorderedLevel = config.numbering.unordered.levels[0];
  const orderedLevel = config.numbering.ordered.levels[0];

  return (
    <fieldset className="settings-form">
      <legend>Списки</legend>
      <section className="settings-subsection" aria-label="Маркированный список">
        <h3>Маркированный список</h3>
        <TextField
          label="Символ маркера"
          value={unorderedLevel?.text ?? "•"}
          onChange={(text) =>
            updateConfig((current) =>
              updateFirstNumberingLevel(current, "unordered", {
                format: "bullet",
                text: text || "•"
              })
            )
          }
        />
        <NumberField
          errorMessage="Отступ списка не может быть отрицательным."
          label="Левый отступ маркера, мм"
          min={0}
          step={1}
          unitLabel="мм"
          value={twipToMillimeters(unorderedLevel?.leftTwip)}
          onValidChange={(value) =>
            updateConfig((current) =>
              updateFirstNumberingLevel(current, "unordered", {
                leftTwip: millimetersToTwip(value)
              })
            )
          }
        />
        <NumberField
          errorMessage="Висячий отступ не может быть отрицательным."
          label="Висячий отступ маркера, мм"
          min={0}
          step={1}
          unitLabel="мм"
          value={twipToMillimeters(unorderedLevel?.hangingTwip)}
          onValidChange={(value) =>
            updateConfig((current) =>
              updateFirstNumberingLevel(current, "unordered", {
                hangingTwip: millimetersToTwip(value)
              })
            )
          }
        />
      </section>

      <section className="settings-subsection" aria-label="Нумерованный список">
        <h3>Нумерованный список</h3>
        <SelectField
          label="Формат нумерации"
          options={numberingFormatOptions}
          value={(orderedLevel?.format === "bullet"
            ? "decimal"
            : orderedLevel?.format ?? "decimal") as Exclude<LevelFormat, "bullet">}
          onChange={(format) =>
            updateConfig((current) =>
              updateFirstNumberingLevel(current, "ordered", {
                format,
                text: levelTextForFormat(format)
              })
            )
          }
        />
        <NumberField
          errorMessage="Начальный номер должен быть больше 0."
          label="Начальный номер"
          min={1}
          step={1}
          value={orderedLevel?.start ?? 1}
          onValidChange={(value) =>
            updateConfig((current) =>
              updateFirstNumberingLevel(current, "ordered", {
                start: Math.round(value)
              })
            )
          }
        />
        <NumberField
          errorMessage="Отступ списка не может быть отрицательным."
          label="Левый отступ нумерации, мм"
          min={0}
          step={1}
          unitLabel="мм"
          value={twipToMillimeters(orderedLevel?.leftTwip)}
          onValidChange={(value) =>
            updateConfig((current) =>
              updateFirstNumberingLevel(current, "ordered", {
                leftTwip: millimetersToTwip(value)
              })
            )
          }
        />
        <NumberField
          errorMessage="Висячий отступ не может быть отрицательным."
          label="Висячий отступ нумерации, мм"
          min={0}
          step={1}
          unitLabel="мм"
          value={twipToMillimeters(orderedLevel?.hangingTwip)}
          onValidChange={(value) =>
            updateConfig((current) =>
              updateFirstNumberingLevel(current, "ordered", {
                hangingTwip: millimetersToTwip(value)
              })
            )
          }
        />
      </section>
    </fieldset>
  );
}
