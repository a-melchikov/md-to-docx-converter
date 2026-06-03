import { Packer } from "docx";
import type { Diagnostic } from "@md-to-docx/domain";

import type { DocxBuilderContext } from "./builder-context.js";
import { buildDocxDocument } from "./document-builder.js";
import {
  createDocxDiagnostic,
  generationFailedMessage
} from "./diagnostics.js";
import { safeDocxFileName } from "./safe-file-name.js";
import {
  DOCX_CONTENT_TYPE,
  type GenerateDocxInput,
  type GenerateDocxResult
} from "./types.js";

export const generateDocx = async (
  input: GenerateDocxInput
): Promise<GenerateDocxResult> => {
  const diagnostics: Diagnostic[] = [...(input.diagnostics ?? [])];
  const fileName = safeDocxFileName(input.options?.fileName);
  const context: DocxBuilderContext = {
    assets: input.assets,
    diagnostics
  };

  try {
    const document = buildDocxDocument({
      document: input.document,
      creator: input.options?.creator,
      subject: input.options?.subject,
      title: input.options?.title,
      description: input.options?.description,
      context
    });
    const buffer = await Packer.toBuffer(document);

    return {
      buffer: Uint8Array.from(buffer),
      diagnostics,
      contentType: DOCX_CONTENT_TYPE,
      fileName
    };
  } catch (error) {
    diagnostics.push(
      createDocxDiagnostic({
        severity: "error",
        code: "docx.generation.failed",
        message: generationFailedMessage(),
        metadata: {
          error:
            error instanceof Error
              ? error.message
              : "Unknown DOCX generation error"
        }
      })
    );

    return {
      buffer: new Uint8Array(),
      diagnostics,
      contentType: DOCX_CONTENT_TYPE,
      fileName
    };
  }
};
