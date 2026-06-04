import type { Diagnostic } from "@md-to-docx/domain";
import type { GenerateDocxResult } from "@md-to-docx/docx-adapter";

export interface ConvertErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly requestId: string;
  };
  readonly diagnostics: readonly Diagnostic[];
}

export type ConvertServiceResult =
  | {
      readonly ok: true;
      readonly artifact: GenerateDocxResult;
      readonly diagnostics: readonly Diagnostic[];
    }
  | {
      readonly ok: false;
      readonly statusCode: 400 | 413;
      readonly body: ConvertErrorBody;
    };
