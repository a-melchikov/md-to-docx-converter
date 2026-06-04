export const DEFAULT_DOCX_FILE_NAME = "document.docx";
export const MAX_DOCX_FILE_NAME_LENGTH = 120;

export type FileNameValidationResult =
  | {
      readonly valid: true;
      readonly fileName: string;
    }
  | {
      readonly valid: false;
      readonly message: string;
    };

export function defaultDocxFileName(markdownFileName?: string): string {
  if (markdownFileName === undefined || markdownFileName.trim().length === 0) {
    return DEFAULT_DOCX_FILE_NAME;
  }

  const normalized = normalizeDocxFileName(markdownFileName);
  return normalized.valid ? normalized.fileName : DEFAULT_DOCX_FILE_NAME;
}

export function normalizeDocxFileName(
  value: string
): FileNameValidationResult {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      message: "Имя файла не может быть пустым."
    };
  }

  if (containsUnsafeFileNameCharacter(trimmed)) {
    return {
      valid: false,
      message: "Имя файла содержит недопустимые символы."
    };
  }

  if (trimmed.length > MAX_DOCX_FILE_NAME_LENGTH) {
    return {
      valid: false,
      message: "Имя файла слишком длинное."
    };
  }

  const normalized = ensureDocxExtension(trimmed);

  if (normalized.length > MAX_DOCX_FILE_NAME_LENGTH) {
    return {
      valid: false,
      message: "Имя файла слишком длинное."
    };
  }

  return {
    valid: true,
    fileName: normalized
  };
}

export function safeDownloadFileName(
  value: string | undefined,
  fallback: string
): string {
  if (value === undefined) {
    return fallback;
  }

  const normalized = normalizeDocxFileName(value);
  return normalized.valid ? normalized.fileName : fallback;
}

function ensureDocxExtension(value: string): string {
  const withoutMarkdownExtension = value.replace(/\.(?:md|markdown)$/iu, "");

  return withoutMarkdownExtension.toLowerCase().endsWith(".docx")
    ? withoutMarkdownExtension
    : `${withoutMarkdownExtension}.docx`;
}

function containsUnsafeFileNameCharacter(value: string): boolean {
  return /[\\/]/u.test(value) || [...value].some(isControlCharacter);
}

function isControlCharacter(character: string): boolean {
  const code = character.charCodeAt(0);
  return code <= 0x1f || code === 0x7f;
}
