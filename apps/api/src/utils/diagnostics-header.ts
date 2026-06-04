import type { Diagnostic } from "@md-to-docx/domain";

export const DIAGNOSTICS_HEADER = "x-md2docx-diagnostics";
export const DIAGNOSTICS_COUNT_HEADER = "x-md2docx-diagnostics-count";
export const DIAGNOSTICS_TRUNCATED_HEADER = "x-md2docx-diagnostics-truncated";
export const MAX_DIAGNOSTICS_HEADER_BYTES = 6_000;

export function diagnosticsToHeader(
  diagnostics: readonly Diagnostic[]
): string {
  const payload = {
    diagnostics
  };
  const encoded = encodeBase64Url(JSON.stringify(payload));

  if (Buffer.byteLength(encoded, "utf8") <= MAX_DIAGNOSTICS_HEADER_BYTES) {
    return encoded;
  }

  return encodeBase64Url(
    JSON.stringify({
      diagnostics: diagnostics.slice(0, 5),
      truncated: true,
      total: diagnostics.length
    })
  );
}

export function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

export function decodeDiagnosticsHeader(value: string): unknown {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;
}
