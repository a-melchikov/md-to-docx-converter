import {
  twipToMillimeters,
  updatePageMarginMillimeters,
  type PageMarginSide
} from "./config-update.js";
import { NumberField } from "./fields.js";
import type { StyleSettingsFormProps } from "./types.js";

const marginFields: readonly {
  readonly label: string;
  readonly side: PageMarginSide;
}[] = [
  { label: "Верхнее поле", side: "topTwip" },
  { label: "Правое поле", side: "rightTwip" },
  { label: "Нижнее поле", side: "bottomTwip" },
  { label: "Левое поле", side: "leftTwip" }
];

export function PageMarginsForm({
  config,
  updateConfig
}: StyleSettingsFormProps) {
  return (
    <fieldset className="settings-form">
      <legend>Поля страницы</legend>
      {marginFields.map((field) => (
        <NumberField
          errorMessage="Поле страницы не может быть отрицательным."
          key={field.side}
          label={`${field.label}, мм`}
          min={0}
          step={1}
          unitLabel="мм"
          value={twipToMillimeters(config.document.page.margin[field.side])}
          onValidChange={(value) =>
            updateConfig((current) =>
              updatePageMarginMillimeters(current, field.side, value)
            )
          }
        />
      ))}
    </fieldset>
  );
}
