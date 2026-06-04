import type { Diagnostic } from "@md-to-docx/domain";
import type { HtmlPreviewMetadata } from "@md-to-docx/html-preview";

export interface HtmlPreviewPayload {
  readonly html: string;
  readonly css: string;
  readonly metadata: HtmlPreviewMetadata;
}

export interface HtmlPreviewServiceResult {
  readonly preview?: HtmlPreviewPayload | undefined;
  readonly diagnostics: readonly Diagnostic[];
}

export interface HtmlPreviewResponse {
  readonly preview?: HtmlPreviewPayload | undefined;
  readonly diagnostics: readonly Diagnostic[];
}

export function toHtmlPreviewResponse(
  result: HtmlPreviewServiceResult
): HtmlPreviewResponse {
  return {
    ...(result.preview === undefined ? {} : { preview: result.preview }),
    diagnostics: result.diagnostics
  };
}
