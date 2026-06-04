import type { ConversionConfig } from "@md-to-docx/config-schema";

export type ConfigStateSource =
  | "default"
  | "visual"
  | "json-import"
  | "json-editor";

export interface ConfigState {
  readonly config: ConversionConfig;
  readonly isDirty: boolean;
  readonly lastUpdatedAt?: string;
  readonly source: ConfigStateSource;
}

export type ConfigUpdater = (config: ConversionConfig) => ConversionConfig;

export function cloneConversionConfig(
  config: ConversionConfig
): ConversionConfig {
  return JSON.parse(JSON.stringify(config)) as ConversionConfig;
}
