import { defaultConfig, type ConversionConfig } from "@md-to-docx/config-schema";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MarkdownDocumentState } from "../../markdown-editor/markdown-document-state.js";
import { PreviewPanel } from "../PreviewPanel.js";
import { LIVE_PREVIEW_DEBOUNCE_MS } from "../preview-types.js";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("PreviewPanel", () => {
  it("calls preview API after debounce when Markdown changes", async () => {
    const fetchSpy = mockSuccessfulPreview();
    const { rerender } = renderPreview({ markdown: "# Первый" });

    expect(fetchSpy).not.toHaveBeenCalled();

    rerender(previewPanel({ markdown: "# Второй" }));
    await advancePreviewDebounce();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(readRequest(fetchSpy).markdown).toBe("# Второй");
  });

  it("sends current config to preview API when config changes", async () => {
    const fetchSpy = mockSuccessfulPreview();
    const changedConfig = cloneConfig(defaultConfig);
    changedConfig.document.page.size = {
      ...changedConfig.document.page.size,
      preset: "A3"
    };

    const { rerender } = renderPreview({ config: defaultConfig });
    rerender(previewPanel({ config: changedConfig }));
    await advancePreviewDebounce();

    expect(readRequest(fetchSpy).config.document.page.size.preset).toBe("A3");
  });

  it("sends preview options including zoom", async () => {
    const fetchSpy = mockSuccessfulPreview();
    const onZoomChange = vi.fn();
    renderPreview({ onZoomChange, zoomPercent: 100 });

    fireEvent.change(screen.getByLabelText("Масштаб предпросмотра"), {
      target: { value: "120" }
    });

    expect(onZoomChange).toHaveBeenCalledWith(120);

    await advancePreviewDebounce();
    expect(readRequest(fetchSpy).options).toEqual({
      pageMode: "continuous",
      zoom: 1
    });
  });

  it("renders loading state in Russian while preview request is pending", async () => {
    mockPendingPreview();
    renderPreview();

    await advancePreviewDebounce();

    expect(
      screen.getByText("Обновление предпросмотра...")
    ).toBeInTheDocument();
  });

  it("renders preview HTML and scoped CSS from successful response", async () => {
    mockSuccessfulPreview({
      html: '<div class="md2docx-preview">Заголовок API</div>',
      css: ".md2docx-preview { color: red; }"
    });
    renderPreview();

    await advancePreviewDebounce();

    expect(screen.getByTestId("preview-html")).toHaveTextContent(
      "Заголовок API"
    );
    expect(screen.getByTestId("preview-css")).toHaveTextContent(
      ".md2docx-preview { color: red; }"
    );
    expect(screen.getByText("Быстрый предпросмотр")).toBeInTheDocument();
  });

  it("does not render duplicated layout panel controls in preview toolbar", async () => {
    mockSuccessfulPreview();
    renderPreview();

    await advancePreviewDebounce();

    expect(
      screen.queryByRole("button", { name: /панель ввода из предпросмотра/u })
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /предупреждения из предпросмотра/u })
    ).toBeNull();
  });

  it("renders paginated preview toolbar with navigation controls", async () => {
    mockSuccessfulPreview({
      html:
        '<div class="md2docx-preview"><div class="md2docx-page"><div class="md2docx-page-content">Страница 1</div></div><div class="md2docx-page"><div class="md2docx-page-content">Страница 2</div></div></div>',
      metadata: { pageCountApproximation: 2, fidelity: "fast-preview" }
    });
    renderPreview();

    await advancePreviewDebounce();

    expect(
      screen.getByRole("heading", { name: "Предпросмотр DOCX" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Все страницы" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Одна страница" })).toBeNull();
    expect(screen.getByText(hasText("Страница 1 из 2"))).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Предыдущая страница" })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Следующая страница" })
    ).toBeEnabled();
  });

  it("does not shrink resolved DOCX page width in the web preview wrapper", () => {
    const css = readFileSync(
      join(process.cwd(), "src/styles.css"),
      "utf8"
    );

    expect(css).toContain("width: var(--page-width, 794px)");
    expect(css).not.toContain("width: min(100%, var(--page-width");
  });

  it("supports page navigation without changing zoom", async () => {
    const onZoomChange = vi.fn();
    mockSuccessfulPreview({
      html:
        '<div class="md2docx-preview"><div class="md2docx-page"><div class="md2docx-page-content">Страница 1</div></div><div class="md2docx-page"><div class="md2docx-page-content">Страница 2</div></div></div>',
      metadata: { pageCountApproximation: 2, fidelity: "fast-preview" }
    });
    renderPreview({ onZoomChange, zoomPercent: 110 });

    await advancePreviewDebounce();
    fireEvent.click(screen.getByRole("button", { name: "Следующая страница" }));

    expect(screen.getByText(hasText("Страница 2 из 2"))).toBeInTheDocument();
    expect(screen.getByLabelText("Масштаб предпросмотра")).toHaveValue("110");
    expect(onZoomChange).not.toHaveBeenCalled();
  });

  it("displays backend diagnostics next to preview", async () => {
    mockSuccessfulPreview({
      diagnostics: [
        {
          severity: "warning",
          code: "preview.fidelity.fastMode",
          message:
            "Предпросмотр работает в быстром режиме и может отличаться от точного отображения в Microsoft Word.",
          path: [{ type: "root", name: "document" }]
        }
      ]
    });
    renderPreview();

    await advancePreviewDebounce();

    expect(
      screen.getByLabelText("Предупреждения предпросмотра")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Предпросмотр работает в быстром режиме и может отличаться от точного отображения в Microsoft Word."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Код: preview.fidelity.fastMode")).toBeInTheDocument();
    expect(screen.getByText("Путь: document")).toBeInTheDocument();
  });

  it("shows a Russian network error without clearing editor/config state", async () => {
    const onZoomChange = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Network failed")))
    );
    renderPreview({ onZoomChange, zoomPercent: 90 });

    await advancePreviewDebounce();

    expect(
      screen.getAllByText("Сервер предпросмотра недоступен.").length
    ).toBeGreaterThan(0);
    expect(screen.getByLabelText("Масштаб предпросмотра")).toHaveValue("90");
    expect(onZoomChange).not.toHaveBeenCalled();
  });

  it("shows API errors in Russian and includes request id when available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            {
              error: {
                code: "api.preview.markdownTooLarge",
                message: "Markdown слишком большой для предпросмотра.",
                requestId: "req-123"
              }
            },
            413,
            { "x-request-id": "req-123" }
          )
        )
      )
    );
    renderPreview();

    await advancePreviewDebounce();

    expect(
      screen.getAllByText("Markdown слишком большой для предпросмотра.").length
    ).toBeGreaterThan(0);
    expect(screen.getByText("Request ID: req-123")).toBeInTheDocument();
  });

  it("keeps the last successful preview visible after a later API error", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(
        previewResponse({
          html: '<div class="md2docx-preview">Успешный предпросмотр</div>'
        })
      )
      .mockRejectedValueOnce(new TypeError("Network failed"));
    vi.stubGlobal("fetch", fetchSpy);
    const { rerender } = renderPreview({ markdown: "# Успех" });

    await advancePreviewDebounce();
    expect(screen.getByText("Успешный предпросмотр")).toBeInTheDocument();

    rerender(previewPanel({ markdown: "# Ошибка" }));
    await advancePreviewDebounce();

    expect(
      screen.getAllByText("Сервер предпросмотра недоступен.").length
    ).toBeGreaterThan(0);
    expect(screen.getByText("Успешный предпросмотр")).toBeInTheDocument();
  });

  it("cancels an active request when a newer preview request starts", async () => {
    const signals: AbortSignal[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string | URL | Request, init?: RequestInit) => {
        if (init?.signal) {
          signals.push(init.signal);
        }
        return new Promise<Response>(() => undefined);
      })
    );
    const { rerender } = renderPreview({ markdown: "# Старый" });

    await advancePreviewDebounce();
    expect(signals).toHaveLength(1);

    rerender(previewPanel({ markdown: "# Новый" }));

    expect(signals[0]?.aborted).toBe(true);
  });

  it("does not let an outdated response overwrite the latest preview", async () => {
    let resolveFirst: ((response: Response) => void) | undefined;
    let resolveSecond: ((response: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<Response>((resolve) => {
              resolveFirst = resolve;
            })
        )
        .mockImplementationOnce(
          () =>
            new Promise<Response>((resolve) => {
              resolveSecond = resolve;
            })
        )
    );
    const { rerender } = renderPreview({ markdown: "# Старый" });

    await advancePreviewDebounce();
    rerender(previewPanel({ markdown: "# Новый" }));
    await advancePreviewDebounce();

    await act(async () => {
      resolveSecond?.(
        previewResponse({
          html: '<div class="md2docx-preview">Новый результат</div>'
        })
      );
    });
    await flushPreviewPromises();
    expect(screen.getByText("Новый результат")).toBeInTheDocument();

    await act(async () => {
      resolveFirst?.(
        previewResponse({
          html: '<div class="md2docx-preview">Старый результат</div>'
        })
      );
    });
    await flushPreviewPromises();

    expect(screen.queryByText("Старый результат")).not.toBeInTheDocument();
    expect(screen.getByText("Новый результат")).toBeInTheDocument();
  });

  it("does not show AbortError as a user-facing error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.reject(new DOMException("The operation was aborted.", "AbortError"))
      )
    );
    renderPreview();

    await advancePreviewDebounce();

    expect(
      screen.queryByText("Сервер предпросмотра недоступен.")
    ).not.toBeInTheDocument();
  });

  it("aborts an active request on unmount", async () => {
    const signals: AbortSignal[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string | URL | Request, init?: RequestInit) => {
        if (init?.signal) {
          signals.push(init.signal);
        }
        return new Promise<Response>(() => undefined);
      })
    );
    const { unmount } = renderPreview();

    await advancePreviewDebounce();
    unmount();

    expect(signals[0]?.aborted).toBe(true);
  });

  it("does not render a fake frontend preview before API response", () => {
    mockPendingPreview();
    renderPreview({ markdown: "# Только API" });

    expect(screen.queryByText("Только API")).not.toBeInTheDocument();
  });

  it("only calls the HTML preview endpoint and never DOCX export", async () => {
    const fetchSpy = mockSuccessfulPreview();
    renderPreview();

    await advancePreviewDebounce();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(
      "/api/v1/preview/html"
    );
    expect(String(fetchSpy.mock.calls[0]?.[0])).not.toContain("/api/v1/convert");
  });
});

interface RenderPreviewOptions {
  readonly markdown?: string;
  readonly fileName?: string | undefined;
  readonly config?: ConversionConfig;
  readonly zoomPercent?: number;
  readonly onZoomChange?: (zoomPercent: number) => void;
}

interface PreviewResponseOptions {
  readonly html?: string;
  readonly css?: string;
  readonly diagnostics?: unknown[];
  readonly metadata?: Record<string, unknown>;
}

interface PreviewRequestBody {
  readonly markdown: string;
  readonly config: ConversionConfig;
  readonly options: {
    readonly zoom: number;
    readonly pageMode: "continuous";
  };
}

function renderPreview(options: RenderPreviewOptions = {}) {
  return render(previewPanel(options));
}

function previewPanel(options: RenderPreviewOptions = {}) {
  return (
    <PreviewPanel
      config={options.config ?? defaultConfig}
      markdownDocument={markdownDocument(options)}
      zoomPercent={options.zoomPercent ?? 100}
      onZoomChange={options.onZoomChange ?? vi.fn()}
    />
  );
}

function markdownDocument(
  options: RenderPreviewOptions
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

async function advancePreviewDebounce() {
  await act(async () => {
    vi.advanceTimersByTime(LIVE_PREVIEW_DEBOUNCE_MS);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function flushPreviewPromises() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

function mockSuccessfulPreview(options: PreviewResponseOptions = {}) {
  const fetchSpy = vi.fn(() => Promise.resolve(previewResponse(options)));
  vi.stubGlobal("fetch", fetchSpy);
  return fetchSpy;
}

function mockPendingPreview() {
  const fetchSpy = vi.fn(() => new Promise<Response>(() => undefined));
  vi.stubGlobal("fetch", fetchSpy);
  return fetchSpy;
}

function previewResponse(options: PreviewResponseOptions = {}): Response {
  return jsonResponse({
    preview: {
      html:
        options.html ??
        '<div class="md2docx-preview"><div class="md2docx-page">Текст</div></div>',
      css: options.css ?? ".md2docx-preview { --preview-zoom: 1; }",
      metadata: options.metadata ?? { fidelity: "fast-preview" }
    },
    diagnostics: options.diagnostics ?? []
  });
}

function jsonResponse(
  body: unknown,
  status = 200,
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

function readRequest(fetchSpy: ReturnType<typeof vi.fn>): PreviewRequestBody {
  const init = fetchSpy.mock.calls.at(-1)?.[1] as RequestInit | undefined;
  if (typeof init?.body !== "string") {
    throw new Error("Preview request body was not serialized JSON.");
  }

  return JSON.parse(init.body) as PreviewRequestBody;
}

function hasText(expectedText: string) {
  return (_content: string, element: Element | null) =>
    element?.textContent?.replace(/\s+/gu, " ").trim() === expectedText;
}
