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
  height: var(--page-height);
  margin: 0 auto 24px auto;
  background: #ffffff;
  box-shadow: 0 12px 34px rgba(15, 23, 42, 0.18);
  transform: scale(var(--preview-zoom));
  transform-origin: top center;
  overflow: hidden;
}

.md2docx-page-content {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: var(--margin-top) var(--margin-right) var(--margin-bottom) var(--margin-left);
  overflow-wrap: anywhere;
}

.md2docx-heading {
  line-height: 1.16;
  margin-block: 0 0.45em;
}

.md2docx-paragraph {
  line-height: 1.45;
}

.md2docx-paragraph,
.md2docx-code-block,
.md2docx-blockquote,
.md2docx-list,
.md2docx-table,
.md2docx-image-block,
.md2docx-thematic-break {
  margin-block-start: 0;
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
  margin-block-start: 0;
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
