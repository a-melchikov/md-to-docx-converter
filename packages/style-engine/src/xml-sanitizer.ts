import type {
  Diagnostic,
  DocumentPath,
  SourceLocation
} from "@md-to-docx/domain";
import type { InvalidXmlCharPolicy } from "@md-to-docx/config-schema";

import {
  createStyleDiagnostic,
  invalidXmlCharacterMessage
} from "./diagnostics.js";

export interface SanitizeXmlTextInput {
  readonly value: string;
  readonly policy: InvalidXmlCharPolicy;
  readonly source?: SourceLocation | undefined;
  readonly path?: DocumentPath | undefined;
}

export interface SanitizeXmlTextResult {
  readonly value: string;
  readonly diagnostics: readonly Diagnostic[];
}

export const sanitizeXmlText = (
  input: SanitizeXmlTextInput
): SanitizeXmlTextResult => {
  const diagnostics: Diagnostic[] = [];
  let value = "";

  for (const character of input.value) {
    const codePoint = character.codePointAt(0) ?? 0;

    if (!isInvalidXmlControlCharacter(codePoint)) {
      value += character;
      continue;
    }

    const action =
      input.policy === "replace-uFFFD"
        ? "replaced"
        : input.policy === "error"
          ? "error"
          : "skipped";

    diagnostics.push(
      createStyleDiagnostic({
        severity: input.policy === "error" ? "error" : "warning",
        code: "style.invalidXmlCharacter",
        message: invalidXmlCharacterMessage(codePoint, action),
        source: input.source,
        path: input.path,
        metadata: {
          codePoint: `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`,
          policy: input.policy
        }
      })
    );

    if (input.policy === "replace-uFFFD") {
      value += "\uFFFD";
    }
  }

  return { value, diagnostics };
};

const isInvalidXmlControlCharacter = (codePoint: number): boolean =>
  (codePoint >= 0x0000 && codePoint <= 0x0008) ||
  codePoint === 0x000b ||
  codePoint === 0x000c ||
  (codePoint >= 0x000e && codePoint <= 0x001f);
