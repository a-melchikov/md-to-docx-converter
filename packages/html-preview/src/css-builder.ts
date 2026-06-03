export const buildPreviewCss = (): string => `
.md2docx-preview {
  --preview-background: #eef1f4;
  background: var(--preview-background);
  color: #111827;
  box-sizing: border-box;
  min-height: 100%;
  padding: 24px;
  overflow: auto;
}

.md2docx-preview *,
.md2docx-preview *::before,
.md2docx-preview *::after {
  box-sizing: border-box;
}

.md2docx-page {
  width: var(--page-width);
  min-height: var(--page-height);
  margin: 0 auto 24px auto;
  background: #ffffff;
  box-shadow: 0 12px 34px rgba(15, 23, 42, 0.18);
  transform: scale(var(--preview-zoom));
  transform-origin: top center;
}

.md2docx-page-content {
  min-height: var(--page-height);
  padding: var(--margin-top) var(--margin-right) var(--margin-bottom) var(--margin-left);
  overflow-wrap: anywhere;
}

.md2docx-preview[data-page-mode="single"] .md2docx-page {
  margin-bottom: 0;
}

.md2docx-paragraph,
.md2docx-heading,
.md2docx-code-block,
.md2docx-blockquote,
.md2docx-list,
.md2docx-table,
.md2docx-image-block,
.md2docx-thematic-break {
  max-width: 100%;
}

.md2docx-code-block {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.md2docx-inline-code {
  border-radius: 3px;
  padding: 0.05em 0.25em;
}

.md2docx-list {
  padding-left: 1.5em;
}

.md2docx-list-item > .md2docx-paragraph:first-child {
  margin-top: 0;
}

.md2docx-table {
  border-collapse: collapse;
  table-layout: auto;
}

.md2docx-table-cell {
  vertical-align: top;
}

.md2docx-link {
  color: #0563c1;
}

.md2docx-image {
  display: inline-block;
  height: auto;
}

.md2docx-image-placeholder {
  display: inline-block;
  border: 1px dashed #9ca3af;
  color: #4b5563;
  background: #f9fafb;
  padding: 6px 8px;
  font-size: 0.9em;
}

.md2docx-diagnostics {
  margin: 16px auto 0 auto;
  width: var(--page-width);
  color: #374151;
  font: 12px system-ui, sans-serif;
}
`.trim();
