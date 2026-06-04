import { alignmentOptions, fontFamilyOptions } from "./form-options.js";
import { NumberField, SelectField } from "./fields.js";
import {
  halfPointsToPoints,
  pointsToHalfPoints,
  twipToMillimeters,
  twipToPoints,
  updateDefaultFirstLineIndent,
  updateDefaultParagraphAlignment,
  updateDefaultParagraphSpacing,
  updateDefaultRun
} from "./config-update.js";
import type { StyleSettingsFormProps } from "./types.js";

export function ParagraphSettingsForm({
  config,
  updateConfig
}: StyleSettingsFormProps) {
  const run = config.defaults.run;
  const paragraph = config.defaults.paragraph;

  return (
    <fieldset className="settings-form">
      <legend>Обычный текст</legend>
      <SelectField
        label="Шрифт обычного текста"
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
        label="Размер обычного текста, pt"
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
      <SelectField
        label="Выравнивание абзаца"
        options={alignmentOptions}
        value={paragraph.alignment ?? "left"}
        onChange={(alignment) =>
          updateConfig((current) =>
            updateDefaultParagraphAlignment(current, alignment)
          )
        }
      />
      <NumberField
        errorMessage="Интервал не может быть отрицательным."
        label="Интервал перед абзацем, pt"
        min={0}
        step={1}
        unitLabel="pt"
        value={twipToPoints(paragraph.spacing?.beforeTwip)}
        onValidChange={(value) =>
          updateConfig((current) =>
            updateDefaultParagraphSpacing(current, "beforeTwip", value)
          )
        }
      />
      <NumberField
        errorMessage="Интервал не может быть отрицательным."
        label="Интервал после абзаца, pt"
        min={0}
        step={1}
        unitLabel="pt"
        value={twipToPoints(paragraph.spacing?.afterTwip)}
        onValidChange={(value) =>
          updateConfig((current) =>
            updateDefaultParagraphSpacing(current, "afterTwip", value)
          )
        }
      />
      <NumberField
        errorMessage="Межстрочный интервал должен быть больше 0."
        label="Межстрочный интервал, pt"
        requiredPositive
        step={1}
        unitLabel="pt"
        value={twipToPoints(paragraph.spacing?.lineTwip)}
        onValidChange={(value) =>
          updateConfig((current) =>
            updateDefaultParagraphSpacing(current, "lineTwip", value)
          )
        }
      />
      <NumberField
        errorMessage="Отступ первой строки не может быть отрицательным."
        label="Отступ первой строки, мм"
        min={0}
        step={1}
        unitLabel="мм"
        value={twipToMillimeters(paragraph.indentation?.firstLineTwip)}
        onValidChange={(value) =>
          updateConfig((current) => updateDefaultFirstLineIndent(current, value))
        }
      />
    </fieldset>
  );
}
