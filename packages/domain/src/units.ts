declare const unitBrand: unique symbol;

export type Twip = number & { readonly [unitBrand]: "Twip" };
export type HalfPoint = number & { readonly [unitBrand]: "HalfPoint" };
export type Emu = number & { readonly [unitBrand]: "Emu" };
export type Pct = number & { readonly [unitBrand]: "Pct" };

export const twip = (value: number): Twip =>
  assertNonNegativeFiniteNumber(value, "Twip") as Twip;

export const halfPoint = (value: number): HalfPoint =>
  assertNonNegativeFiniteNumber(value, "HalfPoint") as HalfPoint;

export const emu = (value: number): Emu =>
  assertNonNegativeFiniteNumber(value, "Emu") as Emu;

export const pct = (value: number): Pct =>
  assertNonNegativeFiniteNumber(value, "Pct") as Pct;

export const pointsToTwip = (points: number): Twip =>
  twip(Math.round(assertNonNegativeFiniteNumber(points, "Points") * 20));

export const pointsToHalfPoint = (points: number): HalfPoint =>
  halfPoint(Math.round(assertNonNegativeFiniteNumber(points, "Points") * 2));

export const inchesToTwip = (inches: number): Twip =>
  twip(Math.round(assertNonNegativeFiniteNumber(inches, "Inches") * 1440));

export const centimetersToTwip = (centimeters: number): Twip =>
  inchesToTwip(assertNonNegativeFiniteNumber(centimeters, "Centimeters") / 2.54);

export const millimetersToTwip = (millimeters: number): Twip =>
  centimetersToTwip(assertNonNegativeFiniteNumber(millimeters, "Millimeters") / 10);

export const pixelsToEmu = (pixels: number, dpi = 96): Emu => {
  const safePixels = assertNonNegativeFiniteNumber(pixels, "Pixels");
  const safeDpi = assertPositiveFiniteNumber(dpi, "DPI");

  return emu(Math.round((safePixels / safeDpi) * 914400));
};

const assertNonNegativeFiniteNumber = (
  value: number,
  label: string
): number => {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} value must be a finite number.`);
  }

  if (value < 0) {
    throw new RangeError(`${label} value must not be negative.`);
  }

  return value;
};

const assertPositiveFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} value must be a finite number.`);
  }

  if (value <= 0) {
    throw new RangeError(`${label} value must be greater than zero.`);
  }

  return value;
};
