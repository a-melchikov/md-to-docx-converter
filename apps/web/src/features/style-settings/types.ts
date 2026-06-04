import type { ConversionConfig } from "@md-to-docx/config-schema";

import type { ConfigUpdater } from "../../state/config-state.js";

export interface StyleSettingsFormProps {
  readonly config: ConversionConfig;
  readonly updateConfig: (updater: ConfigUpdater) => void;
}
