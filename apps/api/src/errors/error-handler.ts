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
    const message = isServerError
      ? "Внутренняя ошибка сервера"
      : getErrorMessage(error);
    const code = isServerError ? "internal.serverError" : "http.requestError";

    if (isServerError) {
      request.log.error({ err: error, requestId: request.id }, "request failed");
    } else if (config.nodeEnv !== "test") {
      request.log.warn({ err: error, requestId: request.id }, "request rejected");
    }

    sendError(reply, statusCode, {
      error: {
        code,
        message,
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
