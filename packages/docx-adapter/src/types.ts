import type { Diagnostic, ResolvedDocument } from "@md-to-docx/domain";

export const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document" as const;

export type DocxImageFormat = "png" | "jpg" | "jpeg";

export interface DocxAsset {
  readonly data: Uint8Array | ArrayBuffer;
  readonly format?: DocxImageFormat | undefined;
  readonly contentType?: "image/png" | "image/jpeg" | undefined;
  readonly fileName?: string | undefined;
}

export type DocxAssetMap = Readonly<Record<string, DocxAsset>>;

export interface DocxGenerationOptions {
  readonly fileName?: string | undefined;
  readonly creator?: string | undefined;
  readonly subject?: string | undefined;
  readonly title?: string | undefined;
  readonly description?: string | undefined;
}

export interface GenerateDocxInput {
  readonly document: ResolvedDocument;
  readonly options?: DocxGenerationOptions | undefined;
  readonly assets?: DocxAssetMap | undefined;
  readonly diagnostics?: readonly Diagnostic[] | undefined;
}

export interface GenerateDocxResult {
  readonly buffer: Uint8Array;
  readonly diagnostics: readonly Diagnostic[];
  readonly contentType: typeof DOCX_CONTENT_TYPE;
  readonly fileName: string;
}
