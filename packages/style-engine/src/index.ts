export type {
  ResolveStylesInput,
  ResolveStylesResult
} from "./resolve-styles.js";
export { resolveStyles } from "./resolve-styles.js";

export { mergeStyleSets, resolveStyleCascade } from "./cascade.js";
export type { StyleDiagnosticCode } from "./diagnostics.js";
export {
  percentToPct,
  centimetersToTwip,
  inchesToTwip,
  millimetersToTwip,
  pixelsToEmu,
  pointsToHalfPoint,
  pointsToTwip
} from "./units.js";
