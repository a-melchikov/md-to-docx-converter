import type { ConversionConfig } from "@md-to-docx/config-schema";
import type { Diagnostic } from "@md-to-docx/domain";
import { useCallback, useEffect, useState } from "react";

import {
  ConvertApiError,
  requestDocxConvert
} from "../../shared/api/convert-api.js";
import type { MarkdownDocumentState } from "../markdown-editor/markdown-document-state.js";
import { downloadDocxBlob } from "./download-docx.js";
import type { DocxExportState } from "./export-state.js";
import {
  defaultDocxFileName,
  normalizeDocxFileName,
  safeDownloadFileName
} from "./file-name.validation.js";

export interface UseDocxExportInput {
  readonly markdownDocument: MarkdownDocumentState;
  readonly config: ConversionConfig;
}

export interface UseDocxExportResult {
  readonly state: DocxExportState;
  readonly fileNameInput: string;
  readonly fileNameError?: string | undefined;
  readonly setFileNameInput: (value: string) => void;
  readonly exportDocx: () => Promise<void>;
}

export function useDocxExport({
  markdownDocument,
  config
}: UseDocxExportInput): UseDocxExportResult {
  const [fileNameInput, setFileNameInputState] = useState(() =>
    defaultDocxFileName(markdownDocument.fileName)
  );
  const [fileNameDirty, setFileNameDirty] = useState(false);
  const [fileNameError, setFileNameError] = useState<string | undefined>();
  const [state, setState] = useState<DocxExportState>(() => ({
    status: "idle",
    fileName: defaultDocxFileName(markdownDocument.fileName),
    diagnostics: []
  }));

  useEffect(() => {
    if (fileNameDirty) {
      return;
    }

    const nextFileName = defaultDocxFileName(markdownDocument.fileName);
    setFileNameInputState(nextFileName);
    setState((current) => ({
      ...current,
      fileName: nextFileName
    }));
  }, [fileNameDirty, markdownDocument.fileName]);

  const setFileNameInput = useCallback((value: string) => {
    setFileNameDirty(true);
    setFileNameInputState(value);
    setFileNameError(undefined);
  }, []);

  const exportDocx = useCallback(async () => {
    if (state.status === "loading") {
      return;
    }

    if (markdownDocument.content.trim().length === 0) {
      setState((current) => ({
        ...current,
        status: "error",
        errorMessage: "Введите Markdown перед экспортом DOCX.",
        requestId: undefined
      }));
      return;
    }

    const fileNameValidation = normalizeDocxFileName(fileNameInput);

    if (!fileNameValidation.valid) {
      setFileNameError(fileNameValidation.message);
      setState((current) => ({
        ...current,
        status: "error",
        errorMessage: fileNameValidation.message,
        requestId: undefined
      }));
      return;
    }

    const requestedFileName = fileNameValidation.fileName;
    setFileNameError(undefined);
    setState((current) => ({
      ...current,
      status: "loading",
      fileName: requestedFileName,
      errorMessage: undefined,
      requestId: undefined
    }));

    try {
      const response = await requestDocxConvert({
        markdown: markdownDocument.content,
        config,
        options: {
          fileName: requestedFileName
        },
        assets: {}
      });
      const downloadFileName = safeDownloadFileName(
        response.fileName,
        requestedFileName
      );

      downloadDocxBlob(response.blob, downloadFileName);

      setState({
        status: "success",
        fileName: downloadFileName,
        diagnostics: response.diagnostics,
        lastExportedAt: new Date().toISOString()
      });
      setFileNameInputState(downloadFileName);
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "error",
        diagnostics:
          error instanceof ConvertApiError ? error.diagnostics : current.diagnostics,
        errorMessage: errorMessageFromExportError(error),
        requestId: error instanceof ConvertApiError ? error.requestId : undefined
      }));
    }
  }, [config, fileNameInput, markdownDocument.content, state.status]);

  return {
    state,
    fileNameInput,
    fileNameError,
    setFileNameInput,
    exportDocx
  };
}

function errorMessageFromExportError(error: unknown): string {
  if (error instanceof ConvertApiError) {
    if (
      error.code === "convert.invalidConfig" ||
      error.diagnostics.some((diagnostic) =>
        diagnostic.code.startsWith("config.validation.")
      )
    ) {
      return "Конфигурация содержит ошибки. Исправьте настройки и повторите попытку.";
    }

    if (
      error.status === 413 ||
      error.code === "api.convert.markdownTooLarge"
    ) {
      return "Markdown слишком большой для конвертации.";
    }

    if (error.code === "api.convert.invalidFileName") {
      return "Имя файла содержит недопустимые символы.";
    }

    if (error.code === "convert.unexpectedContentType") {
      return "Сервер вернул неожиданный формат ответа.";
    }

    if (error.status >= 500) {
      return "Внутренняя ошибка сервера конвертации.";
    }

    return error.message.length > 0
      ? error.message
      : "Не удалось скачать DOCX-файл.";
  }

  return "Сервер конвертации недоступен.";
}

export function mergeExportDiagnostics(
  previewDiagnostics: readonly Diagnostic[],
  exportDiagnostics: readonly Diagnostic[]
): readonly Diagnostic[] {
  return [...previewDiagnostics, ...exportDiagnostics];
}
