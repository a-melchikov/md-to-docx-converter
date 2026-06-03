import {
  type ConfigValidationResult,
  validateConfig
} from "@md-to-docx/config-schema";
import type { RenderHtmlPreviewResult } from "@md-to-docx/html-preview";

export type WebAppPackageName = "@md-to-docx/web";
export type WebPreviewResult = RenderHtmlPreviewResult;

export const validateWebConfig: (
  config: unknown
) => ConfigValidationResult = validateConfig;
