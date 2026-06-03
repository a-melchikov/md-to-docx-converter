export { defaultConfig } from "./default-config.js";
export {
  converterConfigSchema,
  converterConfigSchema as configJsonSchema
} from "./schema.js";
export type {
  AdvancedConfig,
  BorderProperties,
  BorderStyle,
  ColumnsConfig,
  ConfigMeta,
  ConverterConfig as ConversionConfig,
  ConverterConfig,
  DefaultsConfig,
  DocumentConfig,
  DocumentMetadataConfig,
  FontProperties,
  HeaderFooterBlock,
  HeaderFooterContent,
  HtmlPolicy,
  ImageProperties,
  InputConfig,
  InvalidXmlCharPolicy,
  LevelFormat,
  LineRule,
  MarkdownProfile,
  NumberingConfig,
  NumberingLevel,
  NumberingPreset,
  PageConfig,
  PageMarginConfig,
  PageNumberPlaceholderPolicy,
  PageOrientation,
  PageSizeConfig,
  PageSizePreset,
  ParagraphAlignment,
  ParagraphIndentation,
  ParagraphProperties,
  ParagraphSpacing,
  RunProperties,
  ShadingProperties,
  StyleDefinition,
  StylesConfig,
  TableProperties,
  UnderlineStyle,
  UnsupportedNodePolicy
} from "./types.js";
export type {
  ConfigParseResult,
  ConfigValidationResult,
  JsonSchemaValidationError,
  ValidationResult
} from "./validation.js";
export {
  isValidConfig,
  parseConfig,
  validateConfig,
  validateConfigWithJsonSchema
} from "./validation.js";
