import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  configJsonSchema,
  defaultConfig,
  isValidConfig,
  parseConfig,
  validateConfig
} from "../src/index.js";

const readFixture = (path: string): unknown =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${path}`, import.meta.url), "utf8")
  ) as unknown;

const pathToString = (
  path: NonNullable<ReturnType<typeof validateConfig>["diagnostics"][number]["path"]>
): string =>
  path
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

describe("runtime config validation", () => {
  it("validates and parses defaultConfig", () => {
    expect(isValidConfig(defaultConfig)).toBe(true);

    const validationResult = validateConfig(defaultConfig);
    expect(validationResult.valid).toBe(true);
    expect(validationResult.diagnostics).toEqual([]);

    const parseResult = parseConfig(defaultConfig);
    expect(parseResult.valid).toBe(true);
    expect(parseResult.config?.version).toBe("1.0.0");
    expect(parseResult.diagnostics).toEqual([]);
  });

  it("validates the valid fixture", () => {
    const result = validateConfig(readFixture("valid/default-config.json"));

    expect(result.valid).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });

  it.each([
    [
      "invalid/missing-version.json",
      "config.validation.required",
      "version"
    ],
    [
      "invalid/unknown-field.json",
      "config.validation.additionalProperty",
      "unknown"
    ],
    [
      "invalid/invalid-enum.json",
      "config.validation.enum",
      "input.markdownProfile"
    ],
    [
      "invalid/invalid-unit.json",
      "config.validation.minimum",
      "document.page.margin.topTwip"
    ],
    [
      "invalid/invalid-color.json",
      "config.validation.pattern",
      "defaults.run.color"
    ],
    [
      "invalid/runtime-wrong-type.json",
      "config.validation.type",
      "input.enableHtmlSubset"
    ]
  ])("maps %s to diagnostics", (fixture, expectedCode, expectedPath) => {
    const result = validateConfig(readFixture(fixture));

    expect(result.valid).toBe(false);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "error",
          code: expectedCode,
          message: expect.any(String),
          path: expect.any(Array),
          metadata: expect.any(Object)
        })
      ])
    );
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      expectedCode
    );
    expect(
      result.diagnostics
        .flatMap((diagnostic) =>
          diagnostic.path === undefined ? [] : [pathToString(diagnostic.path)]
        )
        .includes(expectedPath)
    ).toBe(true);
  });

  it("does not expose raw Ajv errors as the primary validation result", () => {
    const result = validateConfig(readFixture("invalid/unknown-field.json"));

    expect(result).not.toHaveProperty("errors");
    expect(result.diagnostics[0]?.metadata).toEqual(
      expect.objectContaining({
        keyword: "additionalProperties",
        "param.additionalProperty": "unknown"
      })
    );
  });

  it("exports the JSON Schema under the runtime API name", () => {
    expect(configJsonSchema.$schema).toBe(
      "https://json-schema.org/draft/2020-12/schema"
    );
    expect(configJsonSchema.required).toContain("version");
  });
});
