import {
  type ConfigValidationResult,
  validateConfig
} from "@md-to-docx/config-schema";

export type ApiAppPackageName = "@md-to-docx/api";

export const validateApiConfig: (
  config: unknown
) => ConfigValidationResult = validateConfig;
