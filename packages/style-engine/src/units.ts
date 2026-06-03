import {
  centimetersToTwip,
  inchesToTwip,
  millimetersToTwip,
  pct,
  pixelsToEmu,
  pointsToHalfPoint,
  pointsToTwip
} from "@md-to-docx/domain";

export {
  centimetersToTwip,
  inchesToTwip,
  millimetersToTwip,
  pixelsToEmu,
  pointsToHalfPoint,
  pointsToTwip
};

export const percentToPct = (percent: number) => pct(percent);
