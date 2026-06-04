import type { ConversionConfig } from "@md-to-docx/config-schema";

export interface ConfigState {
  readonly config: ConversionConfig;
  readonly isDirty: boolean;
  readonly lastUpdatedAt?: string;
}

export type ConfigUpdater = (config: ConversionConfig) => ConversionConfig;

export function cloneConversionConfig(
  config: ConversionConfig
): ConversionConfig {
  return JSON.parse(JSON.stringify(config)) as ConversionConfig;
}
