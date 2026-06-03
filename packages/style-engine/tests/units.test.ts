import { describe, expect, it } from "vitest";

import {
  centimetersToTwip,
  inchesToTwip,
  millimetersToTwip,
  percentToPct,
  pixelsToEmu,
  pointsToHalfPoint,
  pointsToTwip
} from "../src/index.js";

describe("unit conversions", () => {
  it("converts points to half-points and twips", () => {
    expect(pointsToHalfPoint(12)).toBe(24);
    expect(pointsToTwip(12)).toBe(240);
  });

  it("converts centimeters, millimeters and inches to twips", () => {
    expect(centimetersToTwip(2.54)).toBe(1440);
    expect(millimetersToTwip(25.4)).toBe(1440);
    expect(inchesToTwip(1)).toBe(1440);
  });

  it("converts pixels to EMU with explicit DPI", () => {
    expect(pixelsToEmu(96, 96)).toBe(914400);
  });

  it("converts percent to pct", () => {
    expect(percentToPct(50)).toBe(50);
  });

  it("rejects unsafe unit values", () => {
    expect(() => pointsToTwip(Number.NaN)).toThrow();
    expect(() => pixelsToEmu(10, 0)).toThrow();
    expect(() => percentToPct(-1)).toThrow();
  });
});
