import { defaultConfig } from "@md-to-docx/config-schema";
import { useCallback, useState } from "react";

import {
  cloneConversionConfig,
  type ConfigState,
  type ConfigStateSource,
  type ConfigUpdater
} from "./config-state.js";

export interface UseConfigStateResult {
  readonly state: ConfigState;
  readonly updateConfig: (updater: ConfigUpdater) => void;
  readonly replaceConfig: (
    config: ConfigState["config"],
    source: Exclude<ConfigStateSource, "default" | "visual">
  ) => void;
}

export function useConfigState(): UseConfigStateResult {
  const [state, setState] = useState<ConfigState>(() => ({
    config: cloneConversionConfig(defaultConfig),
    isDirty: false,
    source: "default"
  }));

  const updateConfig = useCallback((updater: ConfigUpdater) => {
    setState((current) => ({
      config: updater(current.config),
      isDirty: true,
      lastUpdatedAt: new Date().toISOString(),
      source: "visual"
    }));
  }, []);

  const replaceConfig = useCallback(
    (
      config: ConfigState["config"],
      source: Exclude<ConfigStateSource, "default" | "visual">
    ) => {
      setState({
        config: cloneConversionConfig(config),
        isDirty: true,
        lastUpdatedAt: new Date().toISOString(),
        source
      });
    },
    []
  );

  return {
    state,
    updateConfig,
    replaceConfig
  };
}
