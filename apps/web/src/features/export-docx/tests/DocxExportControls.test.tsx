import { defaultConfig, type ConversionConfig } from "@md-to-docx/config-schema";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../../../App.js";
import { DOCX_CONTENT_TYPE } from "../../../shared/api/convert-api.js";
import type { MarkdownDocumentState } from "../../markdown-editor/markdown-document-state.js";
import { DocxExportControls } from "../DocxExportControls.js";

let download: DownloadSpies;

beforeEach(() => {
  download = installDownloadSpies();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("DocxExportControls", () => {
  it("renders the DOCX download button", () => {
    renderExportControls();

    expect(screen.getByRole("button", { name: "Скачать DOCX" })).toBeInTheDocument();
  });

  it("disables DOCX download when Markdown is empty", () => {
    renderExportControls({ markdown: "   " });

    expect(screen.getByRole("button", { name: "Скачать DOCX" })).toBeDisabled();
  });

  it("uses uploaded Markdown filename as default DOCX filename", () => {
    renderExportControls({ fileName: "source.markdown" });

    expect(screen.getByLabelText("Имя файла")).toHaveValue("source.docx");
  });

  it("sends POST /api/v1/convert with current Markdown, config and filename", async () => {
    const fetchSpy = mockSuccessfulConvert();
    const config = cloneConfig(defaultConfig);
    config.document.page.size = {
      ...config.document.page.size,
      preset: "A3"
    };
    renderExportControls({ config, markdown: "# Текущий Markdown" });

    fireEvent.change(screen.getByLabelText("Имя файла"), {
      target: { value: "result.docx" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain("/api/v1/convert");
    expect(readConvertRequest(fetchSpy)).toMatchObject({
      markdown: "# Текущий Markdown",
      config: {
        document: {
          page: {
            size: expect.objectContaining({ preset: "A3" })
          }
        }
      },
      options: {
        fileName: "result.docx"
      },
      assets: {}
    });
  });

  it("normalizes filename without .docx extension before request", async () => {
    const fetchSpy = mockSuccessfulConvert();
    renderExportControls();

    fireEvent.change(screen.getByLabelText("Имя файла"), {
      target: { value: "report" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));

    await waitFor(() => {
      expect(readConvertRequest(fetchSpy).options.fileName).toBe("report.docx");
    });
  });

  it("replaces .md extension with .docx before request", async () => {
    const fetchSpy = mockSuccessfulConvert();
    renderExportControls();

    fireEvent.change(screen.getByLabelText("Имя файла"), {
      target: { value: "report.md" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));

    await waitFor(() => {
      expect(readConvertRequest(fetchSpy).options.fileName).toBe("report.docx");
    });
  });

  it("shows a Russian error for unsafe filename and does not call API", () => {
    const fetchSpy = mockSuccessfulConvert();
    renderExportControls();

    fireEvent.change(screen.getByLabelText("Имя файла"), {
      target: { value: "../secret.docx" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));

    expect(
      screen.getAllByText("Имя файла содержит недопустимые символы.")
    ).toHaveLength(2);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows a Russian error for empty filename", () => {
    const fetchSpy = mockSuccessfulConvert();
    renderExportControls();

    fireEvent.change(screen.getByLabelText("Имя файла"), {
      target: { value: "   " }
    });
    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));

    expect(screen.getAllByText("Имя файла не может быть пустым.")).toHaveLength(2);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows a Russian error for too long filename", () => {
    const fetchSpy = mockSuccessfulConvert();
    renderExportControls();

    fireEvent.change(screen.getByLabelText("Имя файла"), {
      target: { value: "x".repeat(121) }
    });
    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));

    expect(screen.getAllByText("Имя файла слишком длинное.")).toHaveLength(2);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("downloads successful binary response through an object URL", async () => {
    mockSuccessfulConvert();
    renderExportControls();

    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));

    await waitFor(() => {
      expect(download.clickSpy).toHaveBeenCalledTimes(1);
    });
    expect(download.downloadedFileName).toBe("server.docx");
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:docx");
    expect(screen.getByText("DOCX-файл сформирован")).toBeInTheDocument();
  });

  it("uses fallback filename when Content-Disposition is absent", async () => {
    mockSuccessfulConvert({ contentDisposition: null });
    renderExportControls();

    fireEvent.change(screen.getByLabelText("Имя файла"), {
      target: { value: "fallback" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));

    await waitFor(() => {
      expect(download.downloadedFileName).toBe("fallback.docx");
    });
  });

  it("parses diagnostics header and displays export warnings", async () => {
    mockSuccessfulConvert({
      diagnostics: [
        {
          severity: "warning",
          code: "docx.image.missingAsset",
          message:
            "Изображение не было встроено: отсутствуют бинарные данные asset."
        }
      ]
    });
    renderExportControls();

    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));

    expect(
      await screen.findByLabelText("Предупреждения экспорта")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Изображение не было встроено: отсутствуют бинарные данные asset."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Код: docx.image.missingAsset")).toBeInTheDocument();
  });

  it("keeps preview warnings visible after export diagnostics arrive", async () => {
    mockSuccessfulConvert({
      diagnostics: [
        {
          severity: "warning",
          code: "docx.numbering.fallback",
          message: "Для списка использована fallback-нумерация."
        }
      ]
    });
    renderExportControls({
      previewDiagnostics: [
        {
          severity: "warning",
          code: "preview.fidelity.fastMode",
          message: "Предпросмотр работает в быстром режиме."
        }
      ]
    });

    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));

    await screen.findByText("Для списка использована fallback-нумерация.");
    expect(
      screen.getByText("Предпросмотр работает в быстром режиме.")
    ).toBeInTheDocument();
  });

  it("shows a Russian network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Network failed")))
    );
    renderExportControls();

    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));

    expect(
      await screen.findByText("Сервер конвертации недоступен.")
    ).toBeInTheDocument();
  });

  it("shows a Russian invalid config error with diagnostics", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            {
              error: {
                code: "convert.invalidConfig",
                message: "Конфигурация конвертации содержит ошибки.",
                requestId: "req-config"
              },
              diagnostics: [
                {
                  severity: "error",
                  code: "config.validation.required",
                  message: "Поле \"version\" обязательно."
                }
              ]
            },
            400,
            { "x-request-id": "req-config" }
          )
        )
      )
    );
    renderExportControls();

    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));

    expect(
      await screen.findByText(
        "Конфигурация содержит ошибки. Исправьте настройки и повторите попытку."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Request ID: req-config")).toBeInTheDocument();
    expect(screen.getByText("Поле \"version\" обязательно.")).toBeInTheDocument();
  });

  it("shows a Russian markdown size error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            {
              error: {
                code: "api.convert.markdownTooLarge",
                message: "Markdown превышает допустимый размер."
              },
              diagnostics: []
            },
            413
          )
        )
      )
    );
    renderExportControls();

    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));

    expect(
      await screen.findByText("Markdown слишком большой для конвертации.")
    ).toBeInTheDocument();
  });

  it("shows a Russian error for unexpected content type", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response("not-docx", {
            status: 200,
            headers: { "content-type": "text/plain" }
          })
        )
      )
    );
    renderExportControls();

    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));

    expect(
      await screen.findByText("Сервер вернул неожиданный формат ответа.")
    ).toBeInTheDocument();
  });

  it("supports repeated export after a successful export", async () => {
    const fetchSpy = mockSuccessfulConvert();
    renderExportControls();

    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));
    await screen.findByText("DOCX-файл сформирован");
    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  it("shows loading state while export is active", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)));
    renderExportControls();

    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));

    expect(screen.getByText("Формирование DOCX...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Скачать DOCX" })).toBeDisabled();
  });
});

describe("DOCX export integration in App", () => {
  it("does not clear editor state after export error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Network failed")))
    );
    render(<App />);

    fireEvent.change(screen.getByRole("textbox", { name: "Markdown-текст" }), {
      target: { value: "# Сохранить текст" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));

    await screen.findByText("Сервер конвертации недоступен.");
    expect(screen.getByRole("textbox", { name: "Markdown-текст" })).toHaveValue(
      "# Сохранить текст"
    );
  });

  it("does not reset config state after export error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Network failed")))
    );
    render(<App />);

    fireEvent.change(screen.getByLabelText("Размер страницы"), {
      target: { value: "A3" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));

    await screen.findByText("Сервер конвертации недоступен.");
    expect(screen.getByLabelText("Размер страницы")).toHaveValue("A3");
  });
});

interface RenderExportControlsOptions {
  readonly markdown?: string;
  readonly fileName?: string;
  readonly config?: ConversionConfig;
  readonly previewDiagnostics?: ComponentProps<
    typeof DocxExportControls
  >["previewDiagnostics"];
}

interface SuccessfulConvertOptions {
  readonly fileName?: string;
  readonly contentDisposition?: string | null;
  readonly diagnostics?: readonly unknown[];
}

interface ConvertRequestBody {
  readonly markdown: string;
  readonly config: ConversionConfig;
  readonly options: {
    readonly fileName: string;
  };
  readonly assets: Record<string, never>;
}

function renderExportControls(options: RenderExportControlsOptions = {}) {
  return render(
    <DocxExportControls
      config={options.config ?? defaultConfig}
      markdownDocument={markdownDocument(options)}
      previewDiagnostics={options.previewDiagnostics ?? []}
    />
  );
}

function markdownDocument(
  options: RenderExportControlsOptions
): MarkdownDocumentState {
  return {
    content: options.markdown ?? "# Заголовок\n\nТекст",
    ...(options.fileName === undefined ? {} : { fileName: options.fileName }),
    source: "manual"
  };
}

function cloneConfig(config: ConversionConfig): ConversionConfig {
  return JSON.parse(JSON.stringify(config)) as ConversionConfig;
}

function mockSuccessfulConvert(options: SuccessfulConvertOptions = {}) {
  const fileName = options.fileName ?? "server.docx";
  const contentDisposition =
    options.contentDisposition === undefined
      ? `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
      : options.contentDisposition;
  const headers: Record<string, string> = {
    "content-type": DOCX_CONTENT_TYPE,
    "x-md2docx-diagnostics": encodeDiagnosticsHeader(options.diagnostics ?? [])
  };

  if (contentDisposition !== null) {
    headers["content-disposition"] = contentDisposition;
  }

  const fetchSpy = vi.fn(() =>
    Promise.resolve(
      new Response(new Blob([new Uint8Array([80, 75, 3, 4])], {
        type: DOCX_CONTENT_TYPE
      }), {
        status: 200,
        headers
      })
    )
  );
  vi.stubGlobal("fetch", fetchSpy);

  return fetchSpy;
}

function jsonResponse(
  body: unknown,
  status: number,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...headers
    }
  });
}

function readConvertRequest(fetchSpy: ReturnType<typeof vi.fn>): ConvertRequestBody {
  const init = fetchSpy.mock.calls.at(-1)?.[1] as RequestInit | undefined;
  if (typeof init?.body !== "string") {
    throw new Error("Convert request body was not serialized JSON.");
  }

  return JSON.parse(init.body) as ConvertRequestBody;
}

interface DownloadSpies {
  readonly clickSpy: ReturnType<typeof vi.spyOn>;
  readonly downloadedFileName: string;
}

function installDownloadSpies(): DownloadSpies {
  let downloadedFileName = "";
  const clickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function click(this: HTMLAnchorElement) {
      downloadedFileName = this.download;
    });

  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:docx"),
    revokeObjectURL: vi.fn()
  });

  return {
    clickSpy,
    get downloadedFileName() {
      return downloadedFileName;
    }
  };
}

function encodeDiagnosticsHeader(diagnostics: readonly unknown[]): string {
  const bytes = new TextEncoder().encode(JSON.stringify({ diagnostics }));
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}
