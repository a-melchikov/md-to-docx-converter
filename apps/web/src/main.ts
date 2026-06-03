import {
  type ConfigValidationResult,
  validateConfig
} from "@md-to-docx/config-schema";

export type WebAppPackageName = "@md-to-docx/web";

export const validateWebConfig: (
  config: unknown
) => ConfigValidationResult = validateConfig;
