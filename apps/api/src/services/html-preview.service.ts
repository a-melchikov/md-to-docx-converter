import {
  validateConfig,
  type ConversionConfig
} from "@md-to-docx/config-schema";
import type { DiagnosticMetadata } from "@md-to-docx/domain";
import { parseMarkdown } from "@md-to-docx/md-parser";
import { resolveStyles } from "@md-to-docx/style-engine";
import { renderHtmlPreview } from "@md-to-docx/html-preview";

import type { HtmlPreviewServiceResult } from "../dto/html-preview.dto.js";
import {
  createApiPreviewDiagnostic,
  validateHtmlPreviewRequest
} from "../validation/preview-request.validation.js";

export function renderHtmlPreviewForRequest(
  requestBody: unknown
): HtmlPreviewServiceResult {
  const requestValidation = validateHtmlPreviewRequest(requestBody);

  if (!requestValidation.valid) {
    return {
      diagnostics: requestValidation.diagnostics
    };
  }

  const request = requestValidation.request;
  const configCandidate = request.config;
  const configValidation = validateConfig(configCandidate);

  if (!configValidation.valid) {
    return {
      diagnostics: configValidation.diagnostics
    };
  }

  try {
    const config = configCandidate as ConversionConfig;
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
    const previewResult = renderHtmlPreview({
      document: styleResult.document,
      options: request.options
    });

    return {
      preview: {
        html: previewResult.html,
        css: previewResult.css,
        metadata: previewResult.metadata
      },
      diagnostics: [
        ...parseResult.diagnostics,
        ...styleResult.diagnostics,
        ...previewResult.diagnostics
      ]
    };
  } catch (error) {
    return {
      diagnostics: [
        createApiPreviewDiagnostic({
          code: "api.preview.pipelineFailed",
          message: "Не удалось построить HTML preview из-за внутренней ошибки.",
          metadata: pipelineErrorMetadata(error),
          severity: "error"
        })
      ]
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
    message: "Unknown preview pipeline error"
  };
}
