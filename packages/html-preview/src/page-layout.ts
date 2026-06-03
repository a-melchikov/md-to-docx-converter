import type { Diagnostic, ResolvedDocument, ResolvedPageMargin } from "@md-to-docx/domain";

import { createPreviewDiagnostic } from "./diagnostics.js";

export interface PageLayout {
  readonly widthTwip: number;
  readonly heightTwip: number;
  readonly margin: ResolvedPageMargin;
}

const pageSizesTwip = {
  A4: { widthTwip: 11906, heightTwip: 16838 },
  A3: { widthTwip: 16838, heightTwip: 23811 },
  Letter: { widthTwip: 12240, heightTwip: 15840 },
  Legal: { widthTwip: 12240, heightTwip: 20160 }
} as const;

export const resolvePageLayout = (
  document: ResolvedDocument,
  diagnostics: Diagnostic[]
): PageLayout => {
  const pageSize = document.properties.page.size;
  const preset = pageSize.preset;
  const fallback = pageSizesTwip.A4;
  const knownPreset = preset === "custom" ? undefined : pageSizesTwip[preset];
  const customSize =
    pageSize.widthTwip === undefined || pageSize.heightTwip === undefined
      ? undefined
      : { widthTwip: pageSize.widthTwip, heightTwip: pageSize.heightTwip };
  const size = customSize ?? knownPreset ?? fallback;

  if (customSize === undefined && knownPreset === undefined) {
    diagnostics.push(
      createPreviewDiagnostic({
        severity: "warning",
        code: "preview.style.fallback",
        message:
          "Размер страницы не найден. Для предпросмотра использован fallback A4.",
        metadata: { preset }
      })
    );
  }

  const normalized =
    pageSize.orientation === "landscape"
      ? {
          widthTwip: Math.max(size.widthTwip, size.heightTwip),
          heightTwip: Math.min(size.widthTwip, size.heightTwip)
        }
      : {
          widthTwip: Math.min(size.widthTwip, size.heightTwip),
          heightTwip: Math.max(size.widthTwip, size.heightTwip)
        };

  return {
    ...normalized,
    margin: document.properties.page.margin
  };
};

export const twipToPx = (twip: number): number => twip / 15;

export const emuToPx = (emu: number): number => emu / 9525;

export const halfPointToPt = (halfPoint: number): number => halfPoint / 2;

export const cssPx = (value: number): string => `${roundCss(value)}px`;

export const cssPt = (value: number): string => `${roundCss(value)}pt`;

const roundCss = (value: number): number => Math.round(value * 1000) / 1000;
