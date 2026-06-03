import type { Diagnostic, ResolvedDocument } from "@md-to-docx/domain";

export interface RenderHtmlPreviewInput {
  readonly document: ResolvedDocument;
  readonly options?: HtmlPreviewOptions | undefined;
}

export interface HtmlPreviewOptions {
  readonly zoom?: number | undefined;
  readonly pageMode?: "single" | "continuous" | undefined;
  readonly includeCss?: boolean | undefined;
  readonly includeDiagnostics?: boolean | undefined;
}

export interface RenderHtmlPreviewResult {
  readonly html: string;
  readonly css: string;
  readonly diagnostics: readonly Diagnostic[];
  readonly metadata: HtmlPreviewMetadata;
}

export interface HtmlPreviewMetadata {
  readonly pageCountApproximation?: number | undefined;
  readonly fidelity: "fast-preview";
}

export interface ResolvedHtmlPreviewOptions {
  readonly zoom: number;
  readonly pageMode: "single" | "continuous";
  readonly includeCss: boolean;
  readonly includeDiagnostics: boolean;
}
