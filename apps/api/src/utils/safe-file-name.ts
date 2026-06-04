const DEFAULT_DOCX_FILE_NAME = "document.docx";
const MAX_SAFE_FILE_NAME_LENGTH = 120;

export function safeDocxResponseFileName(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_DOCX_FILE_NAME;
  }

  const withoutControls = value
    .trim()
    .split("")
    .filter((character) => !isControlCharacter(character))
    .join("")
    .replace(/[\\/]+/g, "/");
  const lastSegment = withoutControls.split("/").filter(Boolean).at(-1) ?? "";
  const sanitized = lastSegment
    .replace(/\.\.+/g, "")
    .replace(/[:"*?<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  const withoutMdExtension = sanitized.replace(/\.(?:md|markdown)$/iu, "");
  const withExtension = withoutMdExtension.toLowerCase().endsWith(".docx")
    ? withoutMdExtension
    : `${withoutMdExtension}.docx`;
  const clipped = withExtension.slice(0, MAX_SAFE_FILE_NAME_LENGTH);
  const normalized = clipped.toLowerCase().endsWith(".docx")
    ? clipped
    : `${clipped.replace(/\.+$/u, "")}.docx`;

  return normalized === ".docx" || normalized.length === 0
    ? DEFAULT_DOCX_FILE_NAME
    : normalized;
}

export function contentDispositionAttachment(fileName: string): string {
  const fallback = asciiFallback(fileName);
  const encoded = encodeRFC5987ValueChars(fileName);

  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

function asciiFallback(fileName: string): string {
  const fallback = fileName
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\]/g, "_")
    .trim();

  return fallback.length === 0 ? DEFAULT_DOCX_FILE_NAME : fallback;
}

function encodeRFC5987ValueChars(value: string): string {
  return encodeURIComponent(value).replace(/['()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function isControlCharacter(character: string): boolean {
  const code = character.charCodeAt(0);

  return code <= 0x1f || code === 0x7f;
}
