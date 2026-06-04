import { validateConfig } from "@md-to-docx/config-schema";
import type { ConfigValidationResult } from "@md-to-docx/config-schema";

export function validateConversionConfig(config: unknown): ConfigValidationResult {
  return validateConfig(config);
}
