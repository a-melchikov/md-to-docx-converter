import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  createDiagnostic,
  diagnosticCode,
  documentPathField,
  type Diagnostic
} from "@md-to-docx/domain";

import type { ConfigState } from "../../state/config-state.js";
import {
  diagnosticPathLabel,
  exportConfigJson,
  formatConfigJson,
  parseJsonConfigDraft,
  readJsonConfigImport
} from "./json-config-mode.js";

export interface JsonConfigEditorProps {
  readonly configState: ConfigState;
  readonly replaceConfig: (
    config: ConfigState["config"],
    source: "json-import" | "json-editor"
  ) => void;
  readonly onDiagnosticsChange?: ((diagnostics: readonly Diagnostic[]) => void) | undefined;
}

export function JsonConfigEditor({
  configState,
  replaceConfig,
  onDiagnosticsChange
}: JsonConfigEditorProps) {
  const editorId = useId();
  const statusId = useId();
  const errorsId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentConfigJson = useMemo(
    () => formatConfigJson(configState.config),
    [configState.config]
  );
  const [draft, setDraft] = useState(currentConfigJson);
  const [dirty, setDirty] = useState(false);
  const [syntaxError, setSyntaxError] = useState<string>();
  const [diagnostics, setDiagnostics] = useState<readonly Diagnostic[]>([]);
  const [importedFileName, setImportedFileName] = useState<string>();
  const [statusMessage, setStatusMessage] = useState("JSON валиден");

  const hasErrors = syntaxError !== undefined || diagnostics.length > 0;

  useEffect(() => {
    onDiagnosticsChange?.([
      ...(syntaxError ? [createJsonSyntaxDiagnostic(syntaxError)] : []),
      ...diagnostics
    ]);
  }, [diagnostics, onDiagnosticsChange, syntaxError]);

  useEffect(() => {
    if (!dirty) {
      setDraft(currentConfigJson);
      setSyntaxError(undefined);
      setDiagnostics([]);
      setStatusMessage("JSON валиден");
    }
  }, [currentConfigJson, dirty]);

  function handleDraftChange(value: string) {
    setDraft(value);
    setDirty(true);
    setStatusMessage("Есть несохранённые изменения");
    setSyntaxError(undefined);
    setDiagnostics([]);
  }

  function handleApplyJson() {
    const result = parseJsonConfigDraft(draft);

    if (!result.ok) {
      setSyntaxError(result.syntaxError);
      setDiagnostics(result.diagnostics);
      setStatusMessage("JSON содержит ошибки");
      return;
    }

    replaceConfig(result.config, "json-editor");
    setDraft(formatConfigJson(result.config));
    setDirty(false);
    setSyntaxError(undefined);
    setDiagnostics([]);
    setStatusMessage("JSON валиден");
  }

  function handleResetDraft() {
    setDraft(currentConfigJson);
    setDirty(false);
    setSyntaxError(undefined);
    setDiagnostics([]);
    setStatusMessage("JSON валиден");
  }

  async function handleImport(files: FileList | null) {
    const result = await readJsonConfigImport(files);

    if (!result.ok) {
      if (result.draft !== undefined) {
        setDraft(result.draft);
        setDirty(true);
      }

      setSyntaxError(result.syntaxError ?? result.message);
      setDiagnostics(result.diagnostics);
      setStatusMessage("JSON содержит ошибки");
      return;
    }

    replaceConfig(result.config, "json-import");
    setDraft(formatConfigJson(result.config));
    setDirty(false);
    setSyntaxError(undefined);
    setDiagnostics([]);
    setImportedFileName(result.fileName);
    setStatusMessage("JSON валиден");
  }

  return (
    <div className="json-config-editor">
      <div className="json-config-toolbar">
        <button className="secondary-button" type="button" onClick={handleApplyJson}>
          Применить JSON
        </button>
        <button className="secondary-button" type="button" onClick={handleResetDraft}>
          Сбросить изменения JSON
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          Импортировать JSON
        </button>
        <input
          accept=".json,application/json"
          aria-label="Импортировать JSON-файл настроек"
          className="visually-hidden"
          ref={fileInputRef}
          type="file"
          onChange={(event) => {
            void handleImport(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
        />
        <button
          className="secondary-button"
          type="button"
          onClick={() => exportConfigJson(configState.config)}
        >
          Экспортировать JSON
        </button>
      </div>

      <div className="settings-field">
        <label htmlFor={editorId}>JSON конфигурации</label>
        <textarea
          aria-describedby={`${statusId}${hasErrors ? ` ${errorsId}` : ""}`}
          aria-invalid={hasErrors ? "true" : undefined}
          className="json-config-textarea"
          id={editorId}
          spellCheck={false}
          value={draft}
          onChange={(event) => handleDraftChange(event.currentTarget.value)}
        />
      </div>

      <div className="json-config-status" id={statusId} role="status">
        <strong>{statusMessage}</strong>
        {dirty ? <span>Черновик JSON ещё не применён к настройкам.</span> : null}
        {importedFileName ? <span>Импортирован файл: {importedFileName}</span> : null}
      </div>

      {hasErrors ? (
        <div
          aria-label="Ошибки JSON-конфигурации"
          className="json-config-errors"
          id={errorsId}
          role="alert"
        >
          <h3>JSON содержит ошибки</h3>
          {syntaxError ? <p>{syntaxError}</p> : null}
          {diagnostics.length > 0 ? (
            <ul>
              {diagnostics.map((diagnostic, index) => (
                <li key={`${diagnostic.code}-${index}`}>
                  <span>{diagnostic.message}</span>
                  {diagnosticPathLabel(diagnostic) ? (
                    <small>Путь: {diagnosticPathLabel(diagnostic)}</small>
                  ) : null}
                  <small>Код: {diagnostic.code}</small>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function createJsonSyntaxDiagnostic(message: string): Diagnostic {
  return createDiagnostic({
    severity: "error",
    code: diagnosticCode("frontend.configJson.syntax"),
    message,
    path: [documentPathField("config")]
  });
}
