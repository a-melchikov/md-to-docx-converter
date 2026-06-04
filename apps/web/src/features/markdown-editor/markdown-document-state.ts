export type MarkdownDocumentSource = "manual" | "upload" | "example";

export interface MarkdownDocumentState {
  readonly content: string;
  readonly fileName?: string;
  readonly lastUpdatedAt?: string;
  readonly source: MarkdownDocumentSource;
}

export const exampleMarkdown = `# Заголовок документа

Короткий абзац Markdown для будущей конвертации в DOCX.

- Первый пункт
- Второй пункт
`;

export function createExampleMarkdownDocument(): MarkdownDocumentState {
  return {
    content: exampleMarkdown,
    source: "example"
  };
}

export function sourceLabel(source: MarkdownDocumentSource): string {
  switch (source) {
    case "manual":
      return "ручной ввод";
    case "upload":
      return "загруженный файл";
    case "example":
      return "пример";
  }
}
