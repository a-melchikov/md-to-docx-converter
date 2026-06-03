import { Ajv2020 } from "ajv/dist/2020.js";
import type { AnySchema, ErrorObject } from "ajv";
import type {
  Diagnostic,
  DiagnosticCode,
  DiagnosticMetadata,
  DocumentPath,
  DocumentPathSegment
} from "@md-to-docx/domain";

import { converterConfigSchema } from "./schema.js";
import type { ConverterConfig } from "./types.js";

export interface JsonSchemaValidationError {
  readonly instancePath: string;
  readonly schemaPath: string;
  readonly keyword: string;
  readonly message?: string;
  readonly params: Record<string, unknown>;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly JsonSchemaValidationError[];
}

export type ConversionConfig = ConverterConfig;

export interface ConfigValidationResult {
  readonly valid: boolean;
  readonly diagnostics: readonly Diagnostic[];
}

export interface ConfigParseResult {
  readonly valid: boolean;
  readonly config?: ConversionConfig;
  readonly diagnostics: readonly Diagnostic[];
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile(converterConfigSchema as AnySchema);

export const validateConfigWithJsonSchema = (
  config: unknown
): ValidationResult => {
  const valid = validate(config);

  if (valid) {
    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: normalizeErrors(validate.errors ?? [])
  };
};

const normalizeErrors = (
  errors: readonly ErrorObject[]
): readonly JsonSchemaValidationError[] =>
  errors.map((error) => ({
    instancePath: error.instancePath,
    schemaPath: error.schemaPath,
    keyword: error.keyword,
    ...(error.message === undefined ? {} : { message: error.message }),
    params: error.params as Record<string, unknown>
  }));

export const validateConfig = (config: unknown): ConfigValidationResult => {
  const result = validateConfigWithJsonSchema(config);

  if (result.valid) {
    return {
      valid: true,
      diagnostics: []
    };
  }

  return {
    valid: false,
    diagnostics: result.errors.map(mapJsonSchemaErrorToDiagnostic)
  };
};

export const parseConfig = (config: unknown): ConfigParseResult => {
  const result = validateConfig(config);

  if (!result.valid) {
    return result;
  }

  return {
    valid: true,
    config: config as ConversionConfig,
    diagnostics: []
  };
};

export const isValidConfig = (config: unknown): boolean =>
  validateConfigWithJsonSchema(config).valid;

const mapJsonSchemaErrorToDiagnostic = (
  error: JsonSchemaValidationError
): Diagnostic => {
  const path = pathFromError(error);
  const pathLabel = pathToConfigString(path);
  const code = diagnosticCodeFromKeyword(error.keyword);

  return {
    severity: "error",
    code,
    message: messageFromError(error, pathLabel),
    path,
    metadata: metadataFromError(error)
  };
};

const diagnosticCodeFromKeyword = (keyword: string): DiagnosticCode => {
  switch (keyword) {
    case "required":
      return "config.validation.required";
    case "additionalProperties":
      return "config.validation.additionalProperty";
    case "enum":
      return "config.validation.enum";
    case "type":
      return "config.validation.type";
    case "pattern":
      return "config.validation.pattern";
    case "minimum":
      return "config.validation.minimum";
    case "maximum":
      return "config.validation.maximum";
    default:
      return "config.validation.unknown";
  }
};

const messageFromError = (
  error: JsonSchemaValidationError,
  pathLabel: string
): string => {
  switch (error.keyword) {
    case "required":
      return `Поле "${pathLabel}" обязательно.`;
    case "additionalProperties":
      return `Поле "${pathLabel}" не поддерживается конфигурацией.`;
    case "enum":
      return `Поле "${pathLabel}" содержит недопустимое значение.`;
    case "type":
      return `Поле "${pathLabel}" имеет неверный тип.`;
    case "pattern":
      return `Поле "${pathLabel}" не соответствует ожидаемому формату.`;
    case "minimum":
      return `Поле "${pathLabel}" должно быть числом больше или равно ${String(
        error.params.minimum ?? 0
      )}.`;
    case "maximum":
      return `Поле "${pathLabel}" должно быть числом меньше или равно ${String(
        error.params.maximum ?? 100
      )}.`;
    default:
      return `Поле "${pathLabel}" не прошло проверку конфигурации.`;
  }
};

const pathFromError = (error: JsonSchemaValidationError): DocumentPath => {
  if (error.keyword === "required") {
    return jsonPointerToPath(
      error.instancePath,
      primitiveParam(error.params.missingProperty)
    );
  }

  if (error.keyword === "additionalProperties") {
    return jsonPointerToPath(
      error.instancePath,
      primitiveParam(error.params.additionalProperty)
    );
  }

  return jsonPointerToPath(error.instancePath);
};

const jsonPointerToPath = (
  pointer: string,
  trailingProperty?: string
): DocumentPath => {
  const pathSegments =
    pointer.length === 0
      ? []
      : pointer
          .slice(1)
          .split("/")
          .map(decodeJsonPointerSegment)
          .map(segmentToPathSegment);

  if (trailingProperty === undefined) {
    return pathSegments;
  }

  return [...pathSegments, segmentToPathSegment(trailingProperty)];
};

const decodeJsonPointerSegment = (segment: string): string =>
  segment.replaceAll("~1", "/").replaceAll("~0", "~");

const segmentToPathSegment = (segment: string): DocumentPathSegment => {
  if (/^(0|[1-9]\d*)$/.test(segment)) {
    return {
      type: "index",
      index: Number(segment)
    };
  }

  return {
    type: "field",
    name: segment
  };
};

const pathToConfigString = (path: DocumentPath): string => {
  if (path.length === 0) {
    return "config";
  }

  return path
    .map((segment, index) => {
      if (segment.type === "root") {
        return segment.name;
      }

      if (segment.type === "field") {
        return index === 0 ? segment.name : `.${segment.name}`;
      }

      return `[${segment.index}]`;
    })
    .join("");
};

const metadataFromError = (
  error: JsonSchemaValidationError
): DiagnosticMetadata => {
  const metadata: DiagnosticMetadata = {
    keyword: error.keyword,
    instancePath: error.instancePath,
    schemaPath: error.schemaPath
  };

  if (error.message !== undefined) {
    metadata.ajvMessage = error.message;
  }

  for (const [key, value] of Object.entries(error.params)) {
    metadata[`param.${key}`] = metadataValue(value);
  }

  return metadata;
};

const metadataValue = (
  value: unknown
): string | number | boolean | null | undefined => {
  if (
    value === undefined ||
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return JSON.stringify(value);
};

const primitiveParam = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return undefined;
};
