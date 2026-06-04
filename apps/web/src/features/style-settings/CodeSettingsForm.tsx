import { fontFamilyOptions } from "./form-options.js";
import {
  CheckboxField,
  HexColorField,
  NumberField,
  SelectField
} from "./fields.js";
import {
  borderStyleFromEnabled,
  halfPointsToPoints,
  pointsToHalfPoints,
  pointsToTwip,
  twipToPoints,
  updateCodeBlockStyle,
  updateInlineCodeStyle
} from "./config-update.js";
import type { StyleSettingsFormProps } from "./types.js";

export function CodeSettingsForm({
  config,
  updateConfig
}: StyleSettingsFormProps) {
  const inlineCode = config.styles.inlineCode;
  const codeBlock = config.styles.codeBlock;

  return (
    <fieldset className="settings-form">
      <legend>Код</legend>
      <section className="settings-subsection" aria-label="Строчный код">
        <h3>Строчный код</h3>
        <SelectField
          label="Шрифт строчного кода"
          options={fontFamilyOptions.map((font) => ({ label: font, value: font }))}
          value={inlineCode.run?.font?.ascii ?? "Courier New"}
          onChange={(font) =>
            updateConfig((current) =>
              updateInlineCodeStyle(current, {
                run: { font: { ascii: font, hAnsi: font, cs: font } }
              })
            )
          }
        />
        <NumberField
          errorMessage="Размер шрифта должен быть больше 0."
          label="Размер строчного кода, pt"
          requiredPositive
          step={0.5}
          unitLabel="pt"
          value={halfPointsToPoints(inlineCode.run?.sizeHalfPt)}
          onValidChange={(value) =>
            updateConfig((current) =>
              updateInlineCodeStyle(current, {
                run: { sizeHalfPt: pointsToHalfPoints(value) }
              })
            )
          }
        />
        <HexColorField
          label="Фон строчного кода, HEX"
          value={inlineCode.shading?.fill ?? "F2F2F2"}
          onValidChange={(fill) =>
            updateConfig((current) =>
              updateInlineCodeStyle(current, { shading: { fill } })
            )
          }
        />
        <HexColorField
          label="Цвет строчного кода, HEX"
          value={inlineCode.run?.color ?? "000000"}
          onValidChange={(color) =>
            updateConfig((current) =>
              updateInlineCodeStyle(current, { run: { color } })
            )
          }
        />
      </section>

      <section className="settings-subsection" aria-label="Блок кода">
        <h3>Блок кода</h3>
        <SelectField
          label="Шрифт блока кода"
          options={fontFamilyOptions.map((font) => ({ label: font, value: font }))}
          value={codeBlock.run?.font?.ascii ?? "Courier New"}
          onChange={(font) =>
            updateConfig((current) =>
              updateCodeBlockStyle(current, {
                run: { font: { ascii: font, hAnsi: font, cs: font } }
              })
            )
          }
        />
        <NumberField
          errorMessage="Размер шрифта должен быть больше 0."
          label="Размер блока кода, pt"
          requiredPositive
          step={0.5}
          unitLabel="pt"
          value={halfPointsToPoints(codeBlock.run?.sizeHalfPt)}
          onValidChange={(value) =>
            updateConfig((current) =>
              updateCodeBlockStyle(current, {
                run: { sizeHalfPt: pointsToHalfPoints(value) }
              })
            )
          }
        />
        <HexColorField
          label="Фон блока кода, HEX"
          value={codeBlock.shading?.fill ?? "F7F7F7"}
          onValidChange={(fill) =>
            updateConfig((current) =>
              updateCodeBlockStyle(current, { shading: { fill } })
            )
          }
        />
        <NumberField
          errorMessage="Интервал не может быть отрицательным."
          label="Интервал перед блоком кода, pt"
          min={0}
          step={1}
          unitLabel="pt"
          value={twipToPoints(codeBlock.paragraph?.spacing?.beforeTwip)}
          onValidChange={(value) =>
            updateConfig((current) =>
              updateCodeBlockStyle(current, {
                paragraph: { spacing: { beforeTwip: pointsToTwip(value) } }
              })
            )
          }
        />
        <NumberField
          errorMessage="Интервал не может быть отрицательным."
          label="Интервал после блока кода, pt"
          min={0}
          step={1}
          unitLabel="pt"
          value={twipToPoints(codeBlock.paragraph?.spacing?.afterTwip)}
          onValidChange={(value) =>
            updateConfig((current) =>
              updateCodeBlockStyle(current, {
                paragraph: { spacing: { afterTwip: pointsToTwip(value) } }
              })
            )
          }
        />
        <CheckboxField
          checked={codeBlock.border?.style === "single"}
          label="Граница блока кода"
          onChange={(checked) =>
            updateConfig((current) =>
              updateCodeBlockStyle(current, {
                border: { style: borderStyleFromEnabled(checked), color: "808080" }
              })
            )
          }
        />
      </section>
    </fieldset>
  );
}
