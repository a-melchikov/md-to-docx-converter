import { Ajv2020 } from "ajv/dist/2020.js";
import type { AnySchema, ErrorObject } from "ajv";

import { converterConfigSchema } from "./schema.js";

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
