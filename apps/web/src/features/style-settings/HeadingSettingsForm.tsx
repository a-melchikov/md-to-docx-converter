import { fontFamilyOptions } from "./form-options.js";
import { CheckboxField, NumberField, SelectField } from "./fields.js";
import {
  halfPointsToPoints,
  headingKey,
  pointsToHalfPoints,
  pointsToTwip,
  twipToPoints,
  updateHeadingStyle,
  type HeadingLevel
} from "./config-update.js";
import type { StyleSettingsFormProps } from "./types.js";

const headingLevels: readonly HeadingLevel[] = [1, 2, 3, 4, 5, 6];

export function HeadingSettingsForm({
  config,
  updateConfig
}: StyleSettingsFormProps) {
  return (
    <fieldset className="settings-form">
      <legend>Заголовки</legend>
      <div className="heading-settings-grid">
        {headingLevels.map((level) => {
          const style = config.styles[headingKey(level)];
          return (
            <section
              aria-label={`Заголовок ${level}`}
              className="settings-subsection"
              key={level}
            >
              <h3>Заголовок {level}</h3>
              <SelectField
                label={`Шрифт заголовка ${level}`}
                options={fontFamilyOptions.map((font) => ({
                  label: font,
                  value: font
                }))}
                value={style.run?.font?.ascii ?? "Times New Roman"}
                onChange={(font) =>
                  updateConfig((current) =>
                    updateHeadingStyle(current, level, {
                      run: {
                        font: { ascii: font, hAnsi: font, cs: font, eastAsia: font }
                      }
                    })
                  )
                }
              />
              <NumberField
                errorMessage="Размер шрифта должен быть больше 0."
                label={`Размер заголовка ${level}, pt`}
                requiredPositive
                step={0.5}
                unitLabel="pt"
                value={halfPointsToPoints(style.run?.sizeHalfPt)}
                onValidChange={(value) =>
                  updateConfig((current) =>
                    updateHeadingStyle(current, level, {
                      run: { sizeHalfPt: pointsToHalfPoints(value) }
                    })
                  )
                }
              />
              <CheckboxField
                checked={style.run?.bold ?? false}
                label={`Жирный заголовок ${level}`}
                onChange={(checked) =>
                  updateConfig((current) =>
                    updateHeadingStyle(current, level, { run: { bold: checked } })
                  )
                }
              />
              <CheckboxField
                checked={style.run?.italic ?? false}
                label={`Курсив заголовка ${level}`}
                onChange={(checked) =>
                  updateConfig((current) =>
                    updateHeadingStyle(current, level, {
                      run: { italic: checked }
                    })
                  )
                }
              />
              <NumberField
                errorMessage="Интервал не может быть отрицательным."
                label={`Интервал перед заголовком ${level}, pt`}
                min={0}
                step={1}
                unitLabel="pt"
                value={twipToPoints(style.paragraph?.spacing?.beforeTwip)}
                onValidChange={(value) =>
                  updateConfig((current) =>
                    updateHeadingStyle(current, level, {
                      paragraph: {
                        spacing: { beforeTwip: pointsToTwip(value) }
                      }
                    })
                  )
                }
              />
              <NumberField
                errorMessage="Интервал не может быть отрицательным."
                label={`Интервал после заголовка ${level}, pt`}
                min={0}
                step={1}
                unitLabel="pt"
                value={twipToPoints(style.paragraph?.spacing?.afterTwip)}
                onValidChange={(value) =>
                  updateConfig((current) =>
                    updateHeadingStyle(current, level, {
                      paragraph: {
                        spacing: { afterTwip: pointsToTwip(value) }
                      }
                    })
                  )
                }
              />
            </section>
          );
        })}
      </div>
    </fieldset>
  );
}
