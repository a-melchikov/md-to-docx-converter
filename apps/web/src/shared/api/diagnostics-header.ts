import { isDiagnostic, type Diagnostic } from "@md-to-docx/domain";

export const DIAGNOSTICS_HEADER = "x-md2docx-diagnostics";

export interface DiagnosticsHeaderPayload {
  readonly diagnostics: readonly Diagnostic[];
  readonly truncated?: boolean | undefined;
  readonly total?: number | undefined;
}

export function diagnosticsFromHeaders(headers: Headers): DiagnosticsHeaderPayload {
  const value = headers.get(DIAGNOSTICS_HEADER);

  if (value === null || value.trim().length === 0) {
    return {
      diagnostics: []
    };
  }

  try {
    const decoded = JSON.parse(decodeBase64Url(value)) as unknown;
    return parseDiagnosticsHeaderPayload(decoded);
  } catch {
    return {
      diagnostics: []
    };
  }
}

function parseDiagnosticsHeaderPayload(
  value: unknown
): DiagnosticsHeaderPayload {
  if (!isRecord(value) || !Array.isArray(value.diagnostics)) {
    return {
      diagnostics: []
    };
  }

  return {
    diagnostics: value.diagnostics.filter(isDiagnostic),
    ...(typeof value.truncated === "boolean"
      ? { truncated: value.truncated }
      : {}),
    ...(typeof value.total === "number" ? { total: value.total } : {})
  };
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
