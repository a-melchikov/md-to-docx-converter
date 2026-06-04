import { useId, useRef, useState, type DragEvent, type KeyboardEvent } from "react";

import {
  allowedMarkdownExtensions,
  readMarkdownUpload,
  type MarkdownUploadError
} from "./markdown-input.validation.js";

export interface MarkdownUploadProps {
  readonly fileName?: string | undefined;
  readonly onUpload: (content: string, fileName: string) => void;
  readonly onUploadErrorChange?: (message: string | undefined) => void;
}

export function MarkdownUpload({
  fileName,
  onUpload,
  onUploadErrorChange
}: MarkdownUploadProps) {
  const inputId = useId();
  const statusId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<MarkdownUploadError>();
  const [isDragging, setIsDragging] = useState(false);

  const accept = allowedMarkdownExtensions.join(",");

  async function processFiles(files: ArrayLike<File> | null | undefined) {
    const result = await readMarkdownUpload(files);

    if (!result.ok) {
      setError(result.error);
      onUploadErrorChange?.(result.error.message);
      return;
    }

    setError(undefined);
    onUploadErrorChange?.(undefined);
    onUpload(result.content, result.fileName);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void processFiles(event.dataTransfer.files);
  }

  function handleDropZoneKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  return (
    <div className="markdown-upload">
      <div className="upload-toolbar">
        <button
          className="file-picker-button"
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          Выбрать файл
        </button>
        <input
          accept={accept}
          aria-describedby={statusId}
          aria-label="Выбрать Markdown-файл"
          className="visually-hidden"
          id={inputId}
          ref={inputRef}
          type="file"
          onChange={(event) => {
            void processFiles(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
        />
        {fileName ? (
          <span className="uploaded-file-name">Файл: {fileName}</span>
        ) : (
          <span className="upload-hint">Поддерживаются .md, .markdown, .txt</span>
        )}
      </div>

      <div
        aria-describedby={statusId}
        aria-label="Область загрузки Markdown-файла"
        className={`drop-zone${isDragging ? " is-dragging" : ""}`}
        role="button"
        tabIndex={0}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onKeyDown={handleDropZoneKeyDown}
      >
        <strong>Перетащите Markdown-файл сюда</strong>
        <span>Файл заменит текущий текст в редакторе после проверки.</span>
      </div>

      <div className="upload-status" id={statusId}>
        {error ? (
          <p className="upload-error" role="alert">
            {error.message}
          </p>
        ) : (
          <p className="upload-help">
            Лимит файла: 1 МБ, лимит текста: 500 000 символов.
          </p>
        )}
      </div>
    </div>
  );
}
