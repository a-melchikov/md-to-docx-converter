import { useId, useState } from "react";

import {
  exampleMarkdown,
  type MarkdownDocumentState,
  sourceLabel
} from "./markdown-document-state.js";
import { MarkdownUpload } from "./MarkdownUpload.js";

export interface MarkdownEditorProps {
  readonly document: MarkdownDocumentState;
  readonly onChange: (content: string) => void;
  readonly onClear: () => void;
  readonly onUpload: (content: string, fileName: string) => void;
}

export function MarkdownEditor({
  document,
  onChange,
  onClear,
  onUpload
}: MarkdownEditorProps) {
  const editorId = useId();
  const descriptionId = useId();
  const counterId = useId();
  const clearStatusId = useId();
  const [clearRequested, setClearRequested] = useState(false);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string>();

  const describedBy = [
    descriptionId,
    counterId,
    clearRequested ? clearStatusId : undefined,
    uploadErrorMessage ? "markdown-upload-error-context" : undefined
  ]
    .filter(Boolean)
    .join(" ");

  function handleClearClick() {
    if (document.content.length === 0) {
      setClearRequested(false);
      return;
    }

    if (!clearRequested) {
      setClearRequested(true);
      return;
    }

    onClear();
    setClearRequested(false);
  }

  function handleUpload(content: string, fileName: string) {
    setClearRequested(false);
    onUpload(content, fileName);
  }

  return (
    <>
      <div className="panel-heading">
        <div>
          <p className="panel-label">Ввод</p>
          <h2 id="editor-heading">Редактор Markdown</h2>
        </div>
        <span className="panel-status">{sourceLabel(document.source)}</span>
      </div>

      <MarkdownUpload
        fileName={document.fileName}
        onUpload={handleUpload}
        onUploadErrorChange={setUploadErrorMessage}
      />

      <div className="editor-control-row">
        <label className="field-label" htmlFor={editorId}>
          Markdown-текст
        </label>
        <button
          className="secondary-button"
          disabled={document.content.length === 0}
          type="button"
          onClick={handleClearClick}
        >
          {clearRequested ? "Подтвердить очистку" : "Очистить"}
        </button>
      </div>

      <textarea
        aria-describedby={describedBy}
        className="markdown-editor"
        id={editorId}
        placeholder={exampleMarkdown}
        spellCheck={false}
        value={document.content}
        onChange={(event) => {
          setClearRequested(false);
          onChange(event.target.value);
        }}
      />
      <div className="editor-meta">
        <p className="helper-text" id={descriptionId}>
          Markdown хранится в состоянии приложения для будущего предпросмотра и
          экспорта DOCX.
        </p>
        <p className="character-counter" id={counterId}>
          {document.content.length} символов
        </p>
      </div>
      {clearRequested ? (
        <p className="clear-confirmation" id={clearStatusId} role="status">
          Нажмите «Подтвердить очистку», чтобы удалить текущий Markdown.
        </p>
      ) : null}
      {uploadErrorMessage ? (
        <p className="visually-hidden" id="markdown-upload-error-context">
          Ошибка загрузки: {uploadErrorMessage}
        </p>
      ) : null}
    </>
  );
}
