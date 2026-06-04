import { CheckboxField, HexColorField, NumberField } from "./fields.js";
import {
  borderStyleFromEnabled,
  millimetersToTwip,
  twipToMillimeters,
  updateBlockquoteStyle
} from "./config-update.js";
import type { StyleSettingsFormProps } from "./types.js";

export function QuoteSettingsForm({
  config,
  updateConfig
}: StyleSettingsFormProps) {
  const blockquote = config.styles.blockquote;

  return (
    <fieldset className="settings-form">
      <legend>Цитаты</legend>
      <NumberField
        errorMessage="Отступ цитаты не может быть отрицательным."
        label="Левый отступ цитаты, мм"
        min={0}
        step={1}
        unitLabel="мм"
        value={twipToMillimeters(blockquote.paragraph?.indentation?.leftTwip)}
        onValidChange={(value) =>
          updateConfig((current) =>
            updateBlockquoteStyle(current, {
              paragraph: {
                indentation: { leftTwip: millimetersToTwip(value) }
              }
            })
          )
        }
      />
      <CheckboxField
        checked={blockquote.border?.style !== "none"}
        label="Левая граница цитаты"
        onChange={(checked) =>
          updateConfig((current) =>
            updateBlockquoteStyle(current, {
              border: {
                ...current.styles.blockquote.border,
                style: borderStyleFromEnabled(checked)
              }
            })
          )
        }
      />
      <HexColorField
        label="Цвет границы цитаты, HEX"
        value={blockquote.border?.color ?? "808080"}
        onValidChange={(color) =>
          updateConfig((current) =>
            updateBlockquoteStyle(current, { border: { color } })
          )
        }
      />
      <HexColorField
        label="Фон цитаты, HEX"
        value={blockquote.shading?.fill ?? "F8FAFC"}
        onValidChange={(fill) =>
          updateConfig((current) =>
            updateBlockquoteStyle(current, { shading: { fill } })
          )
        }
      />
      <CheckboxField
        checked={blockquote.run?.italic ?? false}
        label="Курсив в цитате"
        onChange={(checked) =>
          updateConfig((current) =>
            updateBlockquoteStyle(current, { run: { italic: checked } })
          )
        }
      />
    </fieldset>
  );
}
