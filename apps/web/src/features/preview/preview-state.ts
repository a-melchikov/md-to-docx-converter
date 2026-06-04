import type { Diagnostic } from "@md-to-docx/domain";

import type { PreviewMetadata } from "../../shared/api/preview-api.js";

export type PreviewStatus = "idle" | "loading" | "success" | "error";

export interface PreviewState {
  readonly status: PreviewStatus;
  readonly html?: string | undefined;
  readonly css?: string | undefined;
  readonly metadata?: PreviewMetadata | undefined;
  readonly diagnostics: readonly Diagnostic[];
  readonly errorMessage?: string | undefined;
  readonly requestId?: string | undefined;
  readonly updatedAt?: string | undefined;
}

export const initialPreviewState: PreviewState = {
  status: "idle",
  diagnostics: []
};
