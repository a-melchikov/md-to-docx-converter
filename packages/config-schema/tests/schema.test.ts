import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  defaultConfig,
  validateConfigWithJsonSchema
} from "../src/index.js";

const readFixture = (path: string): unknown =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${path}`, import.meta.url), "utf8")
  ) as unknown;

describe("converter config JSON Schema", () => {
  it("validates the exported default config", () => {
    const result = validateConfigWithJsonSchema(defaultConfig);

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("validates the valid default-config fixture", () => {
    const result = validateConfigWithJsonSchema(
      readFixture("valid/default-config.json")
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it.each([
    ["missing version", "invalid/missing-version.json", "required"],
    ["unknown root field", "invalid/unknown-field.json", "additionalProperties"],
    ["invalid canonical unit", "invalid/invalid-unit.json", "minimum"],
    ["invalid color", "invalid/invalid-color.json", "pattern"],
    ["invalid enum", "invalid/invalid-enum.json", "enum"]
  ])("rejects %s fixture", (_, fixture, expectedKeyword) => {
    const result = validateConfigWithJsonSchema(readFixture(fixture));

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.keyword)).toContain(
      expectedKeyword
    );
  });

  it("rejects unknown nested style fields", () => {
    const config = structuredClone(defaultConfig);
    config.styles.link = {
      ...config.styles.link,
      paragraph: {}
    };

    const result = validateConfigWithJsonSchema(config);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.keyword === "additionalProperties")).toBe(
      true
    );
  });

  it("checks percentage boundaries", () => {
    const config = structuredClone(defaultConfig);
    config.defaults.table.widthPct = 101;

    const result = validateConfigWithJsonSchema(config);

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.keyword)).toContain("maximum");
  });
});
