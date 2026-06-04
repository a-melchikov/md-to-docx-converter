import { defaultConfig } from "@md-to-docx/config-schema";
import { useCallback, useState } from "react";

import {
  cloneConversionConfig,
  type ConfigState,
  type ConfigUpdater
} from "./config-state.js";

export interface UseConfigStateResult {
  readonly state: ConfigState;
  readonly updateConfig: (updater: ConfigUpdater) => void;
}

export function useConfigState(): UseConfigStateResult {
  const [state, setState] = useState<ConfigState>(() => ({
    config: cloneConversionConfig(defaultConfig),
    isDirty: false
  }));

  const updateConfig = useCallback((updater: ConfigUpdater) => {
    setState((current) => ({
      config: updater(current.config),
      isDirty: true,
      lastUpdatedAt: new Date().toISOString()
    }));
  }, []);

  return {
    state,
    updateConfig
  };
}
