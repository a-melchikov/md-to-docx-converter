import type {
  LevelFormat,
  PageOrientation,
  PageSizePreset,
  ParagraphAlignment
} from "@md-to-docx/config-schema";

export const pageSizeOptions: readonly {
  readonly label: string;
  readonly value: PageSizePreset;
}[] = [
  { label: "A4", value: "A4" },
  { label: "A3", value: "A3" },
  { label: "Letter", value: "Letter" },
  { label: "Legal", value: "Legal" },
  { label: "Custom", value: "custom" }
];

export const orientationOptions: readonly {
  readonly label: string;
  readonly value: PageOrientation;
}[] = [
  { label: "Книжная", value: "portrait" },
  { label: "Альбомная", value: "landscape" }
];

export const fontFamilyOptions = [
  "Times New Roman",
  "Arial",
  "Calibri",
  "Courier New"
] as const;

export const alignmentOptions: readonly {
  readonly label: string;
  readonly value: ParagraphAlignment;
}[] = [
  { label: "Слева", value: "left" },
  { label: "По центру", value: "center" },
  { label: "Справа", value: "right" },
  { label: "По ширине", value: "both" }
];

export const numberingFormatOptions: readonly {
  readonly label: string;
  readonly value: Exclude<LevelFormat, "bullet">;
}[] = [
  { label: "1, 2, 3", value: "decimal" },
  { label: "a, b, c", value: "lowerLetter" },
  { label: "A, B, C", value: "upperLetter" },
  { label: "i, ii, iii", value: "lowerRoman" },
  { label: "I, II, III", value: "upperRoman" }
];

export const tableWidthModeOptions = [
  { label: "Авто", value: "auto" },
  { label: "Проценты", value: "percent" }
] as const;

export type TableWidthMode = (typeof tableWidthModeOptions)[number]["value"];
