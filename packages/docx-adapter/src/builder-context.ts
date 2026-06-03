import type { Diagnostic } from "@md-to-docx/domain";

import type { DocxAssetMap } from "./types.js";

export interface DocxBuilderContext {
  readonly assets?: DocxAssetMap | undefined;
  readonly diagnostics: Diagnostic[];
}
