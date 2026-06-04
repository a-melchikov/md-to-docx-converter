import { useEffect, useId, useState } from "react";

interface NumberFieldProps {
  readonly label: string;
  readonly value: number;
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly step?: number | undefined;
  readonly unitLabel?: string | undefined;
  readonly requiredPositive?: boolean | undefined;
  readonly errorMessage: string;
  readonly onValidChange: (value: number) => void;
}

export function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  unitLabel,
  requiredPositive,
  errorMessage,
  onValidChange
}: NumberFieldProps) {
  const inputId = useId();
  const errorId = useId();
  const [draft, setDraft] = useState(() => String(value));
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!error) {
      setDraft(String(value));
    }
  }, [error, value]);

  function validate(nextDraft: string) {
    setDraft(nextDraft);
    const nextValue = Number(nextDraft);

    if (!Number.isFinite(nextValue)) {
      setError("Введите числовое значение.");
      return;
    }

    if (requiredPositive && nextValue <= 0) {
      setError(errorMessage);
      return;
    }

    if (min !== undefined && nextValue < min) {
      setError(errorMessage);
      return;
    }

    if (max !== undefined && nextValue > max) {
      setError(errorMessage);
      return;
    }

    setError(undefined);
    onValidChange(nextValue);
  }

  return (
    <div className="settings-field">
      <label htmlFor={inputId}>{label}</label>
      <div className="settings-input-with-unit">
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? "true" : undefined}
          id={inputId}
          min={min}
          max={max}
          step={step}
          type="number"
          value={draft}
          onChange={(event) => validate(event.currentTarget.value)}
        />
        {unitLabel ? <span>{unitLabel}</span> : null}
      </div>
      {error ? (
        <p className="settings-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface HexColorFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onValidChange: (value: string) => void;
}

export function HexColorField({
  label,
  value,
  onValidChange
}: HexColorFieldProps) {
  const inputId = useId();
  const errorId = useId();
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!error) {
      setDraft(value);
    }
  }, [error, value]);

  function validate(nextDraft: string) {
    const normalized = nextDraft.trim().replace(/^#/, "").toUpperCase();
    setDraft(nextDraft);

    if (!/^[0-9A-F]{6}$/.test(normalized)) {
      setError("Цвет должен быть в формате HEX, например FF0000.");
      return;
    }

    setError(undefined);
    setDraft(normalized);
    onValidChange(normalized);
  }

  return (
    <div className="settings-field">
      <label htmlFor={inputId}>{label}</label>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? "true" : undefined}
        id={inputId}
        inputMode="text"
        pattern="[0-9A-Fa-f]{6}"
        type="text"
        value={draft}
        onChange={(event) => validate(event.currentTarget.value)}
      />
      {error ? (
        <p className="settings-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export function TextField({ label, value, onChange }: TextFieldProps) {
  const inputId = useId();

  return (
    <div className="settings-field">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}

interface SelectFieldProps<TValue extends string> {
  readonly label: string;
  readonly value: TValue;
  readonly options: readonly { readonly label: string; readonly value: TValue }[];
  readonly onChange: (value: TValue) => void;
}

export function SelectField<TValue extends string>({
  label,
  value,
  options,
  onChange
}: SelectFieldProps<TValue>) {
  const inputId = useId();

  return (
    <div className="settings-field">
      <label htmlFor={inputId}>{label}</label>
      <select
        id={inputId}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value as TValue)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface CheckboxFieldProps {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

export function CheckboxField({
  label,
  checked,
  onChange
}: CheckboxFieldProps) {
  const inputId = useId();

  return (
    <div className="settings-checkbox-field">
      <input
        checked={checked}
        id={inputId}
        type="checkbox"
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <label htmlFor={inputId}>{label}</label>
    </div>
  );
}
