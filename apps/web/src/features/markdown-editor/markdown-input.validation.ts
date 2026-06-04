export const MAX_MARKDOWN_FILE_SIZE_BYTES = 1_048_576;
export const MAX_MARKDOWN_CHARS = 500_000;

export const allowedMarkdownExtensions = [".md", ".markdown", ".txt"] as const;

const allowedMimeTypes = new Set([
  "",
  "text/markdown",
  "text/plain",
  "application/octet-stream"
]);

export type MarkdownUploadErrorCode =
  | "markdownUpload.noFile"
  | "markdownUpload.tooManyFiles"
  | "markdownUpload.unsupportedFormat"
  | "markdownUpload.fileTooLarge"
  | "markdownUpload.readFailed"
  | "markdownUpload.emptyFile"
  | "markdownUpload.contentTooLarge";

export interface MarkdownUploadError {
  readonly code: MarkdownUploadErrorCode;
  readonly message: string;
}

export interface MarkdownUploadSuccess {
  readonly ok: true;
  readonly fileName: string;
  readonly content: string;
}

export interface MarkdownUploadFailure {
  readonly ok: false;
  readonly error: MarkdownUploadError;
}

export type MarkdownUploadResult = MarkdownUploadSuccess | MarkdownUploadFailure;

export async function readMarkdownUpload(
  files: ArrayLike<File> | null | undefined
): Promise<MarkdownUploadResult> {
  const selection = validateMarkdownFileSelection(files);

  if (!selection.ok) {
    return selection;
  }

  const { file } = selection;
  let content: string;

  try {
    content = await file.text();
  } catch {
    return failure(
      "markdownUpload.readFailed",
      "Не удалось прочитать файл как текст."
    );
  }

  if (content.length > MAX_MARKDOWN_CHARS) {
    return failure(
      "markdownUpload.contentTooLarge",
      "Markdown-текст превышает допустимый лимит."
    );
  }

  if (content.trim().length === 0) {
    return failure("markdownUpload.emptyFile", "Файл пустой.");
  }

  return {
    ok: true,
    content,
    fileName: file.name
  };
}

interface MarkdownFileSelectionSuccess {
  readonly ok: true;
  readonly file: File;
}

type MarkdownFileSelectionResult =
  | MarkdownFileSelectionSuccess
  | MarkdownUploadFailure;

export function validateMarkdownFileSelection(
  files: ArrayLike<File> | null | undefined
): MarkdownFileSelectionResult {
  if (!files || files.length === 0) {
    return failure("markdownUpload.noFile", "Файл не выбран.");
  }

  if (files.length > 1) {
    return failure(
      "markdownUpload.tooManyFiles",
      "Можно загрузить только один Markdown-файл."
    );
  }

  const file = files[0];

  if (!file || !isSupportedMarkdownFile(file)) {
    return failure(
      "markdownUpload.unsupportedFormat",
      "Формат файла не поддерживается. Разрешены: .md, .markdown, .txt."
    );
  }

  if (file.size > MAX_MARKDOWN_FILE_SIZE_BYTES) {
    return failure(
      "markdownUpload.fileTooLarge",
      "Размер файла превышает допустимый лимит."
    );
  }

  return {
    ok: true,
    file
  };
}

export function isSupportedMarkdownFile(file: File): boolean {
  return hasAllowedExtension(file.name) && allowedMimeTypes.has(file.type);
}

function hasAllowedExtension(fileName: string): boolean {
  const normalizedName = fileName.trim().toLowerCase();

  return allowedMarkdownExtensions.some((extension) =>
    normalizedName.endsWith(extension)
  );
}

function failure(
  code: MarkdownUploadErrorCode,
  message: string
): MarkdownUploadFailure {
  return {
    ok: false,
    error: {
      code,
      message
    }
  };
}
