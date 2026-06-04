import {
  orientationOptions,
  pageSizeOptions
} from "./form-options.js";
import { NumberField, SelectField } from "./fields.js";
import {
  twipToMillimeters,
  updateCustomPageSizeMillimeters,
  updatePageOrientation,
  updatePageSizePreset
} from "./config-update.js";
import type { StyleSettingsFormProps } from "./types.js";

export function DocumentSettingsForm({
  config,
  updateConfig
}: StyleSettingsFormProps) {
  return (
    <fieldset className="settings-form">
      <legend>Документ</legend>
      <SelectField
        label="Размер страницы"
        options={pageSizeOptions}
        value={config.document.page.size.preset}
        onChange={(value) =>
          updateConfig((current) => updatePageSizePreset(current, value))
        }
      />
      <SelectField
        label="Ориентация страницы"
        options={orientationOptions}
        value={config.document.page.size.orientation}
        onChange={(value) =>
          updateConfig((current) => updatePageOrientation(current, value))
        }
      />
      {config.document.page.size.preset === "custom" ? (
        <>
          <NumberField
            errorMessage="Размер страницы должен быть больше 0."
            label="Ширина страницы, мм"
            requiredPositive
            step={1}
            unitLabel="мм"
            value={twipToMillimeters(
              config.document.page.size.widthTwip ?? 11906
            )}
            onValidChange={(value) =>
              updateConfig((current) =>
                updateCustomPageSizeMillimeters(current, "widthTwip", value)
              )
            }
          />
          <NumberField
            errorMessage="Размер страницы должен быть больше 0."
            label="Высота страницы, мм"
            requiredPositive
            step={1}
            unitLabel="мм"
            value={twipToMillimeters(
              config.document.page.size.heightTwip ?? 16838
            )}
            onValidChange={(value) =>
              updateConfig((current) =>
                updateCustomPageSizeMillimeters(current, "heightTwip", value)
              )
            }
          />
        </>
      ) : null}
    </fieldset>
  );
}
