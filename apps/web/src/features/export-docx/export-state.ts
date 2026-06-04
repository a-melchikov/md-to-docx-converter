import type { Diagnostic } from "@md-to-docx/domain";

export type DocxExportStatus = "idle" | "loading" | "success" | "error";

export interface DocxExportState {
  readonly status: DocxExportStatus;
  readonly fileName: string;
  readonly diagnostics: readonly Diagnostic[];
  readonly errorMessage?: string | undefined;
  readonly requestId?: string | undefined;
  readonly lastExportedAt?: string | undefined;
}
