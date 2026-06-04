import type { ConversionConfig } from "@md-to-docx/config-schema";
import { useEffect, useRef, useState } from "react";

import {
  requestHtmlPreview,
  type PreviewRequestOptions
} from "../../shared/api/preview-api.js";
import { HttpClientError } from "../../shared/api/http-client.js";
import {
  initialPreviewState,
  type PreviewState
} from "./preview-state.js";
import { LIVE_PREVIEW_DEBOUNCE_MS } from "./preview-types.js";

export interface UseLivePreviewInput {
  readonly markdown: string;
  readonly fileName?: string | undefined;
  readonly config: ConversionConfig;
  readonly options: PreviewRequestOptions;
}

export function useLivePreview(input: UseLivePreviewInput): PreviewState {
  const [state, setState] = useState<PreviewState>(initialPreviewState);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    if (input.markdown.trim().length === 0) {
      requestSeqRef.current += 1;
      setState((current) => ({
        ...current,
        status: "idle",
        diagnostics: [],
        errorMessage: undefined
      }));
      return;
    }

    const abortController = new AbortController();
    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    const debounceId = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        status: "loading",
        errorMessage: undefined
      }));

      requestHtmlPreview(
        {
          markdown: input.markdown,
          config: input.config,
          ...(input.fileName === undefined ? {} : { fileName: input.fileName }),
          options: input.options
        },
        abortController.signal
      )
        .then((response) => {
          if (requestSeqRef.current !== requestSeq) {
            return;
          }

          if (response.preview === undefined) {
            setState((current) => ({
              ...current,
              status: "error",
              diagnostics: response.diagnostics,
              errorMessage: errorMessageFromDiagnostics(response.diagnostics),
              updatedAt: new Date().toISOString()
            }));
            return;
          }

          setState({
            status: "success",
            html: response.preview.html,
            css: response.preview.css,
            metadata: response.preview.metadata,
            diagnostics: response.diagnostics,
            updatedAt: new Date().toISOString()
          });
        })
        .catch((error: unknown) => {
          if (isAbortError(error) || requestSeqRef.current !== requestSeq) {
            return;
          }

          setState((current) => ({
            ...current,
            status: "error",
            errorMessage: errorMessageFromError(error),
            requestId:
              error instanceof HttpClientError ? error.requestId : undefined,
            updatedAt: new Date().toISOString()
          }));
        });
    }, LIVE_PREVIEW_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(debounceId);
      abortController.abort();
    };
  }, [input.config, input.fileName, input.markdown, input.options]);

  return state;
}

function errorMessageFromDiagnostics(
  diagnostics: readonly { readonly severity: string; readonly code: string }[]
): string {
  const hasConfigError = diagnostics.some(
    (diagnostic) =>
      diagnostic.severity === "error" &&
      diagnostic.code.startsWith("config.validation.")
  );

  if (hasConfigError) {
    return "Конфигурация содержит ошибки. Исправьте настройки и повторите попытку.";
  }

  return "Не удалось обновить предпросмотр.";
}

function errorMessageFromError(error: unknown): string {
  if (error instanceof HttpClientError) {
    switch (error.status) {
      case 400:
      case 415:
        return "Не удалось обновить предпросмотр. Проверьте данные запроса.";
      case 413:
        return "Markdown слишком большой для предпросмотра.";
      case 500:
        return "Внутренняя ошибка сервера предпросмотра.";
      default:
        return error.message.length > 0
          ? error.message
          : "Не удалось обновить предпросмотр.";
    }
  }

  return "Сервер предпросмотра недоступен.";
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
