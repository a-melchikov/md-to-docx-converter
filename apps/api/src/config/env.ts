export type ApiNodeEnv = "development" | "test" | "production";
export type ApiLogLevel =
  | "fatal"
  | "error"
  | "warn"
  | "info"
  | "debug"
  | "trace"
  | "silent";

export interface ApiEnv {
  nodeEnv: ApiNodeEnv;
  host: string;
  port: number;
  logLevel: ApiLogLevel;
  corsOrigin: string[];
  rateLimitMax: number;
  rateLimitTimeWindow: string;
  multipartFileSizeLimitBytes: number;
  multipartMaxFiles: number;
  multipartMaxFields: number;
}

export class ApiEnvError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ApiEnvError";
  }
}

const DEFAULT_ENV: ApiEnv = {
  nodeEnv: "development",
  host: "0.0.0.0",
  port: 8080,
  logLevel: "info",
  corsOrigin: ["http://localhost:5173"],
  rateLimitMax: 100,
  rateLimitTimeWindow: "1 minute",
  multipartFileSizeLimitBytes: 10_485_760,
  multipartMaxFiles: 4,
  multipartMaxFields: 32
};

const LOG_LEVELS = new Set<ApiLogLevel>([
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent"
]);

const NODE_ENVS = new Set<ApiNodeEnv>(["development", "test", "production"]);
const TIME_WINDOW_PATTERN =
  /^\d+\s+(?:millisecond|milliseconds|second|seconds|minute|minutes|hour|hours|day|days)$/u;

export function loadApiEnv(source: NodeJS.ProcessEnv = process.env): ApiEnv {
  const nodeEnv = parseNodeEnv(source.NODE_ENV);
  const corsOrigin = parseCorsOrigin(
    source.API_CORS_ORIGIN,
    DEFAULT_ENV.corsOrigin,
    nodeEnv
  );

  return {
    nodeEnv,
    host: readString(source.API_HOST, DEFAULT_ENV.host),
    port: parsePort(source.API_PORT, DEFAULT_ENV.port),
    logLevel: parseLogLevel(source.API_LOG_LEVEL, DEFAULT_ENV.logLevel),
    corsOrigin,
    rateLimitMax: parsePositiveInteger(
      source.API_RATE_LIMIT_MAX,
      DEFAULT_ENV.rateLimitMax,
      "API_RATE_LIMIT_MAX"
    ),
    rateLimitTimeWindow: parseTimeWindow(
      source.API_RATE_LIMIT_TIME_WINDOW,
      DEFAULT_ENV.rateLimitTimeWindow
    ),
    multipartFileSizeLimitBytes: parsePositiveInteger(
      source.API_MULTIPART_FILE_SIZE_LIMIT_BYTES,
      DEFAULT_ENV.multipartFileSizeLimitBytes,
      "API_MULTIPART_FILE_SIZE_LIMIT_BYTES"
    ),
    multipartMaxFiles: parsePositiveInteger(
      source.API_MULTIPART_MAX_FILES,
      DEFAULT_ENV.multipartMaxFiles,
      "API_MULTIPART_MAX_FILES"
    ),
    multipartMaxFields: parsePositiveInteger(
      source.API_MULTIPART_MAX_FIELDS,
      DEFAULT_ENV.multipartMaxFields,
      "API_MULTIPART_MAX_FIELDS"
    )
  };
}

function readString(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function parseNodeEnv(value: string | undefined): ApiNodeEnv {
  const candidate = readString(value, DEFAULT_ENV.nodeEnv);
  if (NODE_ENVS.has(candidate as ApiNodeEnv)) {
    return candidate as ApiNodeEnv;
  }

  throw new ApiEnvError(
    `NODE_ENV должен быть одним из: ${Array.from(NODE_ENVS).join(", ")}.`
  );
}

function parseLogLevel(
  value: string | undefined,
  fallback: ApiLogLevel
): ApiLogLevel {
  const candidate = readString(value, fallback);
  if (LOG_LEVELS.has(candidate as ApiLogLevel)) {
    return candidate as ApiLogLevel;
  }

  throw new ApiEnvError(
    `API_LOG_LEVEL должен быть одним из: ${Array.from(LOG_LEVELS).join(", ")}.`
  );
}

function parsePort(value: string | undefined, fallback: number): number {
  const port = parsePositiveInteger(value, fallback, "API_PORT");
  if (port > 65_535) {
    throw new ApiEnvError("API_PORT должен быть в диапазоне 1..65535.");
  }

  return port;
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  key: string
): number {
  const raw = readString(value, String(fallback));
  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiEnvError(`${key} должен быть положительным целым числом.`);
  }

  return parsed;
}

function parseTimeWindow(value: string | undefined, fallback: string): string {
  const raw = readString(value, fallback);
  if (!TIME_WINDOW_PATTERN.test(raw)) {
    throw new ApiEnvError(
      "API_RATE_LIMIT_TIME_WINDOW должен быть строкой вида \"1 minute\"."
    );
  }

  return raw;
}

function parseCorsOrigin(
  value: string | undefined,
  fallback: string[],
  nodeEnv: ApiNodeEnv
): string[] {
  const raw = value?.trim();
  const origins =
    raw && raw.length > 0
      ? raw
          .split(",")
          .map((origin) => origin.trim())
          .filter((origin) => origin.length > 0)
      : fallback;

  if (origins.length === 0) {
    throw new ApiEnvError("API_CORS_ORIGIN должен содержать хотя бы один origin.");
  }

  if (nodeEnv === "production" && origins.includes("*")) {
    throw new ApiEnvError(
      "API_CORS_ORIGIN=* запрещён для production. Укажите явные origins."
    );
  }

  return origins;
}
