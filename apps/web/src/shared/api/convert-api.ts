import type { ConversionConfig } from "@md-to-docx/config-schema";
import type { Diagnostic } from "@md-to-docx/domain";

import { fileNameFromContentDisposition } from "./content-disposition.js";
import { diagnosticsFromHeaders } from "./diagnostics-header.js";
import { getApiBaseUrl } from "./http-client.js";

export const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export interface ConvertRequestOptions {
  readonly fileName: string;
}

export interface ConvertRequest {
  readonly markdown: string;
  readonly config: ConversionConfig;
  readonly options: ConvertRequestOptions;
  readonly assets: Record<string, never>;
}

export interface ConvertBinaryResponse {
  readonly blob: Blob;
  readonly fileName?: string | undefined;
  readonly diagnostics: readonly Diagnostic[];
  readonly contentType: string;
}

export interface ConvertApiErrorInput {
  readonly status: number;
  readonly code: string;
  readonly message: string;
  readonly diagnostics?: readonly Diagnostic[] | undefined;
  readonly requestId?: string | undefined;
}

export class ConvertApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly diagnostics: readonly Diagnostic[];
  public readonly requestId?: string | undefined;

  public constructor(input: ConvertApiErrorInput) {
    super(input.message);
    this.name = "ConvertApiError";
    this.status = input.status;
    this.code = input.code;
    this.diagnostics = input.diagnostics ?? [];
    this.requestId = input.requestId;
  }
}

interface ConvertErrorBody {
  readonly error?: {
    readonly code?: string;
    readonly message?: string;
    readonly requestId?: string;
  };
  readonly diagnostics?: readonly Diagnostic[];
}

export async function requestDocxConvert(
  request: ConvertRequest
): Promise<ConvertBinaryResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/convert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw await createConvertApiError(response);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes(DOCX_CONTENT_TYPE)) {
    throw new ConvertApiError({
      status: response.status,
      code: "convert.unexpectedContentType",
      message: "Сервер вернул неожиданный формат ответа.",
      requestId: response.headers.get("x-request-id") ?? undefined
    });
  }

  const diagnosticsPayload = diagnosticsFromHeaders(response.headers);

  return {
    blob: await response.blob(),
    fileName: fileNameFromContentDisposition(
      response.headers.get("content-disposition")
    ),
    diagnostics: diagnosticsPayload.diagnostics,
    contentType
  };
}

async function createConvertApiError(response: Response): Promise<ConvertApiError> {
  const requestId = response.headers.get("x-request-id") ?? undefined;
  let body: ConvertErrorBody | undefined;

  try {
    body = (await response.json()) as ConvertErrorBody;
  } catch {
    body = undefined;
  }

  return new ConvertApiError({
    status: response.status,
    code: body?.error?.code ?? "convert.requestFailed",
    message: body?.error?.message ?? "Не удалось скачать DOCX-файл.",
    diagnostics: Array.isArray(body?.diagnostics) ? body.diagnostics : [],
    requestId: body?.error?.requestId ?? requestId
  });
}
