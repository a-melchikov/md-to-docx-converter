import { ImageRun, TextRun, type ParagraphChild } from "docx";
import type {
  ResolvedImageBlockNode,
  ResolvedInlineImageNode
} from "@md-to-docx/domain";

import type { DocxBuilderContext } from "./builder-context.js";
import {
  createDocxDiagnostic,
  invalidImageDataMessage,
  missingAssetMessage,
  unsupportedImageFormatMessage
} from "./diagnostics.js";
import type { DocxAsset, DocxImageFormat } from "./types.js";

const emuPerPixelAt96Dpi = 9525;

export const imageRunForNode = (
  node: ResolvedImageBlockNode | ResolvedInlineImageNode,
  context: DocxBuilderContext
): ParagraphChild[] => {
  const image = resolveImageData(node, context);

  if (image === undefined) {
    return fallbackImageText(node);
  }

  const width =
    node.style.image?.maxWidthEmu === undefined
      ? 240
      : Math.max(1, Math.round(node.style.image.maxWidthEmu / emuPerPixelAt96Dpi));
  const height =
    node.style.image?.maxHeightEmu === undefined
      ? Math.max(1, Math.round(width * 0.75))
      : Math.max(1, Math.round(node.style.image.maxHeightEmu / emuPerPixelAt96Dpi));

  return [
    new ImageRun({
      type: image.format,
      data: image.data,
      transformation: { width, height },
      ...(node.alt === undefined
        ? {}
        : {
            altText: {
              title: node.title ?? node.alt,
              description: node.alt,
              name: node.title ?? node.alt
            }
          })
    })
  ];
};

const fallbackImageText = (
  node: ResolvedImageBlockNode | ResolvedInlineImageNode
): ParagraphChild[] =>
  node.alt === undefined || node.alt.length === 0
    ? []
    : [new TextRun({ text: node.alt })];

interface ResolvedImageData {
  readonly data: Uint8Array | ArrayBuffer;
  readonly format: "png" | "jpg";
}

const resolveImageData = (
  node: ResolvedImageBlockNode | ResolvedInlineImageNode,
  context: DocxBuilderContext
): ResolvedImageData | undefined => {
  const dataUriImage = imageFromDataUri(node.src, node, context);

  if (dataUriImage !== undefined) {
    return dataUriImage;
  }

  const assetKey = node.assetId ?? node.src;
  const asset = context.assets?.[assetKey];

  if (asset === undefined) {
    context.diagnostics.push(
      createDocxDiagnostic({
        severity: "warning",
        code: "docx.image.missingAsset",
        message: missingAssetMessage(node.src),
        source: node.source,
        path: node.path,
        metadata: { src: node.src, assetId: node.assetId ?? null }
      })
    );

    return undefined;
  }

  return imageFromAsset(asset, node, context);
};

const imageFromAsset = (
  asset: DocxAsset,
  node: ResolvedImageBlockNode | ResolvedInlineImageNode,
  context: DocxBuilderContext
): ResolvedImageData | undefined => {
  const format = normalizeFormat(asset.format, asset.contentType, asset.data);

  if (format === undefined) {
    context.diagnostics.push(
      createDocxDiagnostic({
        severity: "warning",
        code: "docx.image.unsupportedFormat",
        message: unsupportedImageFormatMessage(node.src),
        source: node.source,
        path: node.path,
        metadata: { src: node.src, contentType: asset.contentType ?? null }
      })
    );

    return undefined;
  }

  return { data: asset.data, format };
};

const imageFromDataUri = (
  src: string,
  node: ResolvedImageBlockNode | ResolvedInlineImageNode,
  context: DocxBuilderContext
): ResolvedImageData | undefined => {
  if (!src.startsWith("data:")) {
    return undefined;
  }

  const match = /^data:(image\/png|image\/jpeg);base64,([A-Za-z0-9+/=]+)$/u.exec(
    src
  );

  if (match === null) {
    context.diagnostics.push(
      createDocxDiagnostic({
        severity: "warning",
        code: "docx.image.invalidData",
        message: invalidImageDataMessage(node.src),
        source: node.source,
        path: node.path,
        metadata: { src: "data-uri" }
      })
    );

    return undefined;
  }

  const contentType = match[1];
  const payload = match[2];

  if (payload === undefined) {
    return undefined;
  }

  try {
    return {
      data: Uint8Array.from(Buffer.from(payload, "base64")),
      format: contentType === "image/png" ? "png" : "jpg"
    };
  } catch {
    context.diagnostics.push(
      createDocxDiagnostic({
        severity: "warning",
        code: "docx.image.invalidData",
        message: invalidImageDataMessage(node.src),
        source: node.source,
        path: node.path,
        metadata: { src: "data-uri" }
      })
    );

    return undefined;
  }
};

const normalizeFormat = (
  format: DocxImageFormat | undefined,
  contentType: DocxAsset["contentType"],
  data: Uint8Array | ArrayBuffer
): "png" | "jpg" | undefined => {
  if (format === "png" || contentType === "image/png") {
    return "png";
  }

  if (format === "jpg" || format === "jpeg" || contentType === "image/jpeg") {
    return "jpg";
  }

  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);

  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e) {
    return "png";
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return "jpg";
  }

  return undefined;
};
