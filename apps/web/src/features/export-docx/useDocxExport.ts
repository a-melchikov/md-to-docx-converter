import type { ConversionConfig } from "@md-to-docx/config-schema";
import {
  createDiagnostic,
  diagnosticCode,
  documentPathField,
  type Diagnostic
} from "@md-to-docx/domain";
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
      const diagnostic = createExportDiagnostic({
        code: "frontend.export.emptyMarkdown",
        message: "Введите Markdown перед экспортом DOCX.",
        field: "markdown"
      });

      setState((current) => ({
        ...current,
        status: "error",
        diagnostics: [diagnostic],
        errorMessage: diagnostic.message,
        requestId: undefined
      }));
      return;
    }

    const fileNameValidation = normalizeDocxFileName(fileNameInput);

    if (!fileNameValidation.valid) {
      const diagnostic = createExportDiagnostic({
        code: "frontend.export.invalidFileName",
        message: fileNameValidation.message,
        field: "options.fileName"
      });

      setFileNameError(fileNameValidation.message);
      setState((current) => ({
        ...current,
        status: "error",
        diagnostics: [diagnostic],
        errorMessage: diagnostic.message,
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
      const errorMessage = errorMessageFromExportError(error);
      const errorDiagnostic = createExportDiagnostic({
        code: exportErrorCode(error),
        message: errorMessage,
        metadata:
          error instanceof ConvertApiError
            ? {
                status: error.status,
                code: error.code,
                requestId: error.requestId
              }
            : undefined
      });

      setState((current) => ({
        ...current,
        status: "error",
        diagnostics:
          error instanceof ConvertApiError
            ? [errorDiagnostic, ...error.diagnostics]
            : [errorDiagnostic],
        errorMessage,
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

function createExportDiagnostic(input: {
  readonly code: string;
  readonly message: string;
  readonly field?: string | undefined;
  readonly metadata?: Diagnostic["metadata"];
}): Diagnostic {
  return createDiagnostic({
    severity: "error",
    code: diagnosticCode(input.code),
    message: input.message,
    ...(input.field === undefined
      ? {}
      : { path: [documentPathField(input.field)] }),
    ...(input.metadata === undefined ? {} : { metadata: input.metadata })
  });
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

function exportErrorCode(error: unknown): string {
  if (error instanceof ConvertApiError) {
    if (error.code === "convert.unexpectedContentType") {
      return "api.export.unexpectedContentType";
    }

    return error.code.startsWith("api.") || error.code.startsWith("convert.")
      ? error.code
      : "api.export.requestFailed";
  }

  return "api.export.network";
}

export function mergeExportDiagnostics(
  previewDiagnostics: readonly Diagnostic[],
  exportDiagnostics: readonly Diagnostic[]
): readonly Diagnostic[] {
  return [...previewDiagnostics, ...exportDiagnostics];
}
