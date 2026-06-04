import {
  validateConfig,
  type ConversionConfig
} from "@md-to-docx/config-schema";
import {
  DOCX_CONTENT_TYPE,
  generateDocx,
  type DocxAssetMap
} from "@md-to-docx/docx-adapter";
import type { DiagnosticMetadata } from "@md-to-docx/domain";
import { parseMarkdown } from "@md-to-docx/md-parser";
import { resolveStyles } from "@md-to-docx/style-engine";

import type { ConvertServiceResult } from "../dto/convert.dto.js";
import {
  createApiConvertDiagnostic,
  validateConvertRequest
} from "../validation/convert-request.validation.js";

export async function convertMarkdownToDocx(
  requestBody: unknown,
  requestId: string
): Promise<ConvertServiceResult> {
  const requestValidation = validateConvertRequest(requestBody);

  if (!requestValidation.valid) {
    const markdownTooLarge = requestValidation.diagnostics.some(
      (diagnostic) => diagnostic.code === "api.convert.markdownTooLarge"
    );

    return {
      ok: false,
      statusCode: markdownTooLarge ? 413 : 400,
      body: {
        error: {
          code: markdownTooLarge
            ? "api.convert.markdownTooLarge"
            : "api.convert.invalidRequest",
          message: markdownTooLarge
            ? "Markdown превышает допустимый размер."
            : "Запрос конвертации содержит ошибки.",
          requestId
        },
        diagnostics: requestValidation.diagnostics
      }
    };
  }

  const request = requestValidation.request;
  const configValidation = validateConfig(request.config);

  if (!configValidation.valid) {
    return {
      ok: false,
      statusCode: 400,
      body: {
        error: {
          code: "convert.invalidConfig",
          message: "Конфигурация конвертации содержит ошибки.",
          requestId
        },
        diagnostics: configValidation.diagnostics
      }
    };
  }

  try {
    const config = request.config as ConversionConfig;
    const parseResult = parseMarkdown({
      markdown: request.markdown,
      ...(request.fileName === undefined ? {} : { fileName: request.fileName }),
      options: {
        markdownProfile: config.input.markdownProfile,
        htmlPolicy: config.input.htmlPolicy,
        onUnsupportedNode: config.input.onUnsupportedNode
      }
    });
    const styleResult = resolveStyles({
      document: parseResult.document,
      config
    });
    const diagnostics = [...parseResult.diagnostics, ...styleResult.diagnostics];
    const artifact = await generateDocx({
      document: styleResult.document,
      diagnostics,
      options: {
        fileName: request.fileName
      },
      assets: {} satisfies DocxAssetMap
    });

    if (artifact.buffer.byteLength === 0) {
      return {
        ok: false,
        statusCode: 400,
        body: {
          error: {
            code: "convert.generationFailed",
            message: "DOCX-файл не был сформирован.",
            requestId
          },
          diagnostics: artifact.diagnostics
        }
      };
    }

    return {
      ok: true,
      artifact: {
        ...artifact,
        contentType: DOCX_CONTENT_TYPE,
        fileName: request.fileName
      },
      diagnostics: artifact.diagnostics
    };
  } catch (error) {
    const diagnostic = createApiConvertDiagnostic({
      severity: "error",
      code: "api.convert.pipelineFailed",
      message: "Не удалось выполнить DOCX-конвертацию из-за внутренней ошибки.",
      metadata: pipelineErrorMetadata(error)
    });

    return {
      ok: false,
      statusCode: 400,
      body: {
        error: {
          code: "convert.generationFailed",
          message: "DOCX-файл не был сформирован.",
          requestId
        },
        diagnostics: [diagnostic]
      }
    };
  }
}

function pipelineErrorMetadata(error: unknown): DiagnosticMetadata {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message
    };
  }

  return {
    message: "Unknown DOCX convert pipeline error"
  };
}
