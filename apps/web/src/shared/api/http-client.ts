export interface ApiErrorBody {
  readonly error?: {
    readonly code?: string;
    readonly message?: string;
    readonly requestId?: string;
  };
}

export class HttpClientError extends Error {
  public readonly status: number;
  public readonly code?: string | undefined;
  public readonly requestId?: string | undefined;

  public constructor(input: {
    readonly status: number;
    readonly message: string;
    readonly code?: string | undefined;
    readonly requestId?: string | undefined;
  }) {
    super(input.message);
    this.name = "HttpClientError";
    this.status = input.status;
    this.code = input.code;
    this.requestId = input.requestId;
  }
}

const defaultApiBaseUrl = "";

export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  return typeof raw === "string" && raw.trim().length > 0
    ? raw.replace(/\/+$/u, "")
    : defaultApiBaseUrl;
}

export async function postJson<TResponse>(
  path: string,
  body: unknown,
  signal?: AbortSignal
): Promise<TResponse> {
  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };

  if (signal !== undefined) {
    requestInit.signal = signal;
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, requestInit);

  if (!response.ok) {
    throw await createHttpError(response);
  }

  return (await response.json()) as TResponse;
}

async function createHttpError(response: Response): Promise<HttpClientError> {
  const requestId = response.headers.get("x-request-id") ?? undefined;
  let body: ApiErrorBody | undefined;

  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = undefined;
  }

  return new HttpClientError({
    status: response.status,
    message: body?.error?.message ?? response.statusText,
    code: body?.error?.code,
    requestId: body?.error?.requestId ?? requestId
  });
}
