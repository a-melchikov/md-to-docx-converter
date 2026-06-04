import type { ConfigValidationResult } from "@md-to-docx/config-schema";

export interface ConfigValidationResponse {
  readonly valid: boolean;
  readonly diagnostics: ConfigValidationResult["diagnostics"];
}

export function toConfigValidationResponse(
  result: ConfigValidationResult
): ConfigValidationResponse {
  return {
    diagnostics: result.diagnostics,
    valid: result.valid
  };
}
