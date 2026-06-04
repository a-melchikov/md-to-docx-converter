import type { FastifyInstance, FastifyReply } from "fastify";

import type { ApiEnv } from "../config/env.js";

interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

export function registerErrorHandlers(
  app: FastifyInstance,
  config: ApiEnv
): void {
  app.setNotFoundHandler((request, reply) => {
    sendError(reply, 404, {
      error: {
        code: "http.notFound",
        message: "Маршрут не найден",
        requestId: request.id
      }
    });
  });

  app.setErrorHandler((error, request, reply) => {
    const statusCode = normalizeStatusCode(error);
    const isServerError = statusCode >= 500;
    const apiError = resolveApiError(error, statusCode, isServerError);

    if (isServerError) {
      request.log.error({ err: error, requestId: request.id }, "request failed");
    } else if (config.nodeEnv !== "test") {
      request.log.warn({ err: error, requestId: request.id }, "request rejected");
    }

    sendError(reply, statusCode, {
      error: {
        code: apiError.code,
        message: apiError.message,
        requestId: request.id
      }
    });
  });
}

function normalizeStatusCode(error: unknown): number {
  const statusCode = getStatusCode(error);
  return statusCode >= 400 && statusCode <= 599 ? statusCode : 500;
}

function getStatusCode(error: unknown): number {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }

  return 500;
}

function resolveApiError(
  error: unknown,
  statusCode: number,
  isServerError: boolean
): Pick<ApiErrorPayload["error"], "code" | "message"> {
  const fastifyCode = getFastifyErrorCode(error);

  if (
    fastifyCode === "FST_ERR_CTP_INVALID_JSON_BODY" ||
    fastifyCode === "FST_ERR_CTP_EMPTY_JSON_BODY"
  ) {
    return {
      code: "request.invalidJson",
      message: "Тело запроса должно быть корректным JSON."
    };
  }

  if (statusCode === 415 || fastifyCode === "FST_ERR_CTP_INVALID_MEDIA_TYPE") {
    return {
      code: "request.unsupportedMediaType",
      message: "Content-Type запроса должен быть application/json."
    };
  }

  if (isServerError) {
    return {
      code: "internal.serverError",
      message: "Внутренняя ошибка сервера"
    };
  }

  return {
    code: "http.requestError",
    message: getErrorMessage(error)
  };
}

function getFastifyErrorCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "Некорректный запрос";
}

function sendError(
  reply: FastifyReply,
  statusCode: number,
  payload: ApiErrorPayload
): void {
  reply.status(statusCode).send(payload);
}
