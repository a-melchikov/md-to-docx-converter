export { defaultConfig } from "./default-config.js";
export { converterConfigSchema } from "./schema.js";
export type {
  AdvancedConfig,
  BorderProperties,
  BorderStyle,
  ColumnsConfig,
  ConfigMeta,
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
  JsonSchemaValidationError,
  ValidationResult
} from "./validation.js";
export { validateConfigWithJsonSchema } from "./validation.js";
