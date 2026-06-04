import {
  parseConfig,
  type ConversionConfig
} from "@md-to-docx/config-schema";
import { pathToString, type Diagnostic } from "@md-to-docx/domain";

export const MAX_CONFIG_JSON_FILE_SIZE_BYTES = 1_048_576;
export const DEFAULT_CONFIG_EXPORT_FILE_NAME = "md-to-docx-config.json";

export interface JsonConfigParseSuccess {
  readonly ok: true;
  readonly config: ConversionConfig;
}

export interface JsonConfigParseFailure {
  readonly ok: false;
  readonly syntaxError?: string;
  readonly diagnostics: readonly Diagnostic[];
}

export type JsonConfigParseResult =
  | JsonConfigParseSuccess
  | JsonConfigParseFailure;

export interface JsonConfigImportSuccess extends JsonConfigParseSuccess {
  readonly fileName: string;
  readonly draft: string;
}

export interface JsonConfigImportFailure extends JsonConfigParseFailure {
  readonly message: string;
  readonly draft?: string;
}

export type JsonConfigImportResult =
  | JsonConfigImportSuccess
  | JsonConfigImportFailure;

export function formatConfigJson(config: ConversionConfig): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}

export function parseJsonConfigDraft(draft: string): JsonConfigParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(draft);
  } catch {
    return {
      ok: false,
      syntaxError: "JSON содержит синтаксическую ошибку. Проверьте формат файла.",
      diagnostics: []
    };
  }

  const result = parseConfig(parsed);

  if (!result.valid || !result.config) {
    return {
      ok: false,
      diagnostics: result.diagnostics
    };
  }

  return {
    ok: true,
    config: result.config
  };
}

export async function readJsonConfigImport(
  files: ArrayLike<File> | null | undefined
): Promise<JsonConfigImportResult> {
  const file = validateJsonFileSelection(files);

  if (!file.ok) {
    return file;
  }

  let draft: string;

  try {
    draft = await file.file.text();
  } catch {
    return {
      ok: false,
      message: "Не удалось прочитать JSON-файл как текст.",
      diagnostics: []
    };
  }

  const parseResult = parseJsonConfigDraft(draft);

  if (!parseResult.ok) {
    return {
      ...parseResult,
      ok: false,
      message:
        parseResult.syntaxError ??
        "JSON-файл содержит ошибки конфигурации.",
      draft
    };
  }

  return {
    ok: true,
    fileName: file.file.name,
    draft,
    config: parseResult.config
  };
}

export function exportConfigJson(
  config: ConversionConfig,
  fileName = DEFAULT_CONFIG_EXPORT_FILE_NAME
): void {
  const blob = new Blob([formatConfigJson(config)], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function diagnosticPathLabel(diagnostic: Diagnostic): string | undefined {
  if (!diagnostic.path || diagnostic.path.length === 0) {
    return undefined;
  }

  return pathToString(diagnostic.path);
}

interface FileSelectionSuccess {
  readonly ok: true;
  readonly file: File;
}

type FileSelectionResult = FileSelectionSuccess | JsonConfigImportFailure;

function validateJsonFileSelection(
  files: ArrayLike<File> | null | undefined
): FileSelectionResult {
  if (!files || files.length === 0) {
    return {
      ok: false,
      message: "JSON-файл не выбран.",
      diagnostics: []
    };
  }

  if (files.length > 1) {
    return {
      ok: false,
      message: "Можно импортировать только один JSON-файл.",
      diagnostics: []
    };
  }

  const file = files[0];

  if (!file || !file.name.trim().toLowerCase().endsWith(".json")) {
    return {
      ok: false,
      message: "Формат файла не поддерживается. Разрешены только .json.",
      diagnostics: []
    };
  }

  if (file.size > MAX_CONFIG_JSON_FILE_SIZE_BYTES) {
    return {
      ok: false,
      message: "Размер JSON-файла превышает допустимый лимит.",
      diagnostics: []
    };
  }

  return {
    ok: true,
    file
  };
}
