import type { DocumentPath, SourceLocation } from "@md-to-docx/domain";

import {
  createPreviewDiagnostic,
  escapedHtmlMessage,
  unsafeUrlMessage,
  type PreviewRenderContext
} from "./diagnostics.js";

export interface EscapeHtmlInput {
  readonly value: string;
  readonly context: PreviewRenderContext;
  readonly source?: SourceLocation | undefined;
  readonly path?: DocumentPath | undefined;
}

const htmlEscapePattern = /[&<>"']/g;

export const escapeHtml = (input: EscapeHtmlInput): string => {
  const escaped = input.value.replace(htmlEscapePattern, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "\"":
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });

  if (escaped !== input.value) {
    input.context.diagnostics.push(
      createPreviewDiagnostic({
        severity: "warning",
        code: "preview.security.escapedHtml",
        message: escapedHtmlMessage(),
        source: input.source,
        path: input.path
      })
    );
  }

  return escaped;
};

export const escapeAttribute = (input: EscapeHtmlInput): string =>
  escapeHtml(input);

export const safeHref = (
  url: string,
  context: PreviewRenderContext,
  source?: SourceLocation | undefined,
  path?: DocumentPath | undefined
): string | undefined => {
  const trimmed = url.trim();

  if (trimmed.length === 0 || trimmed.startsWith("//")) {
    addUnsafeUrlDiagnostic(trimmed, context, source, path);
    return undefined;
  }

  const protocolMatch = /^([A-Za-z][A-Za-z0-9+.-]*):/u.exec(trimmed);

  if (protocolMatch === null) {
    return escapeAttribute({ value: trimmed, context, source, path });
  }

  const protocol = protocolMatch[1]?.toLowerCase();

  if (
    protocol === "http" ||
    protocol === "https" ||
    protocol === "mailto" ||
    protocol === "tel"
  ) {
    return escapeAttribute({ value: trimmed, context, source, path });
  }

  addUnsafeUrlDiagnostic(trimmed, context, source, path);
  return undefined;
};

export const safeImageSrc = (
  src: string,
  context: PreviewRenderContext,
  source?: SourceLocation | undefined,
  path?: DocumentPath | undefined
): string | undefined => {
  const trimmed = src.trim();

  if (/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/u.test(trimmed)) {
    return escapeAttribute({ value: trimmed, context, source, path });
  }

  return safeHref(trimmed, context, source, path);
};

const addUnsafeUrlDiagnostic = (
  url: string,
  context: PreviewRenderContext,
  source?: SourceLocation | undefined,
  path?: DocumentPath | undefined
): void => {
  context.diagnostics.push(
    createPreviewDiagnostic({
      severity: "warning",
      code: "preview.security.unsafeUrl",
      message: unsafeUrlMessage(url),
      source,
      path,
      metadata: { url }
    })
  );
};
