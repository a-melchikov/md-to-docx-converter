import type { ConversionConfig } from "@md-to-docx/config-schema";
import type { Diagnostic } from "@md-to-docx/domain";

import { postJson } from "./http-client.js";

export interface PreviewRequestOptions {
  readonly zoom: number;
  readonly pageMode: "single" | "continuous";
}

export interface PreviewRequest {
  readonly markdown: string;
  readonly config: ConversionConfig;
  readonly fileName?: string | undefined;
  readonly options: PreviewRequestOptions;
}

export interface PreviewResponsePayload {
  readonly html: string;
  readonly css: string;
  readonly metadata: PreviewMetadata;
}

export interface PreviewMetadata {
  readonly fidelity?: string | undefined;
  readonly pageCountApproximation?: number | undefined;
  readonly [key: string]: unknown;
}

export interface PreviewResponse {
  readonly preview?: PreviewResponsePayload | undefined;
  readonly diagnostics: readonly Diagnostic[];
}

export function requestHtmlPreview(
  request: PreviewRequest,
  signal?: AbortSignal
): Promise<PreviewResponse> {
  return postJson<PreviewResponse>("/api/v1/preview/html", request, signal);
}
