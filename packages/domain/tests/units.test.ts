import { describe, expect, it } from "vitest";

import {
  centimetersToTwip,
  emu,
  halfPoint,
  inchesToTwip,
  pct,
  pixelsToEmu,
  pointsToHalfPoint,
  pointsToTwip,
  twip
} from "../src/index.js";

describe("unit factories", () => {
  it("brands valid non-negative unit values", () => {
    expect(twip(1440)).toBe(1440);
    expect(halfPoint(24)).toBe(24);
    expect(emu(914400)).toBe(914400);
    expect(pct(50)).toBe(50);
  });

  it("rejects non-finite and negative values", () => {
    expect(() => twip(Number.NaN)).toThrow(RangeError);
    expect(() => twip(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => twip(-1)).toThrow(RangeError);
    expect(() => halfPoint(-1)).toThrow(RangeError);
    expect(() => emu(-1)).toThrow(RangeError);
    expect(() => pct(-1)).toThrow(RangeError);
  });
});

describe("unit conversions", () => {
  it("converts points to twips and half-points", () => {
    expect(pointsToTwip(12)).toBe(240);
    expect(pointsToHalfPoint(12)).toBe(24);
  });

  it("converts inches and centimeters to twips", () => {
    expect(inchesToTwip(1)).toBe(1440);
    expect(centimetersToTwip(2.54)).toBe(1440);
  });

  it("converts pixels to EMU with configurable DPI", () => {
    expect(pixelsToEmu(96)).toBe(914400);
    expect(pixelsToEmu(300, 300)).toBe(914400);
  });

  it("rejects unsafe conversion inputs", () => {
    expect(() => pointsToTwip(-1)).toThrow(RangeError);
    expect(() => pixelsToEmu(1, 0)).toThrow(RangeError);
  });
});
