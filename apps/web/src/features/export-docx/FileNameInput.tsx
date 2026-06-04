export interface FileNameInputProps {
  readonly value: string;
  readonly error?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly onChange: (value: string) => void;
}

export function FileNameInput({
  value,
  error,
  disabled = false,
  onChange
}: FileNameInputProps) {
  return (
    <label className="export-file-name-field">
      <span>Имя файла</span>
      <input
        aria-describedby={error ? "export-file-name-error" : undefined}
        aria-invalid={error ? "true" : "false"}
        disabled={disabled}
        maxLength={120}
        type="text"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      {error ? (
        <span className="export-inline-error" id="export-file-name-error" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
