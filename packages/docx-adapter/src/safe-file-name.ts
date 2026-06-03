const defaultFileName = "document.docx";

export const safeDocxFileName = (fileName: string | undefined): string => {
  if (fileName === undefined || fileName.trim().length === 0) {
    return defaultFileName;
  }

  const sanitized = fileName
    .trim()
    .replace(/[\\/:"*?<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 180);

  if (sanitized.length === 0) {
    return defaultFileName;
  }

  return sanitized.toLowerCase().endsWith(".docx")
    ? sanitized
    : `${sanitized}.docx`;
};
