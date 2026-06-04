import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "../src/App.js";
import { DOCX_CONTENT_TYPE } from "../src/shared/api/convert-api.js";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("unified diagnostics panel integration", () => {
  it("shows preview diagnostics in the unified panel", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(previewResponse())));
    render(<App />);

    await advancePreviewDebounce();

    expect(
      screen.getAllByText("HTML был пропущен при предпросмотре.").length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/markdown\.unsupportedHtml/u).length).toBeGreaterThan(0);
  });

  it("shows preview API errors in the unified panel", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Network failed")))
    );
    render(<App />);

    await advancePreviewDebounce();

    expect(
      screen.getAllByText("Сервер предпросмотра недоступен.").length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/api\.preview\.network/u).length).toBeGreaterThan(0);
  });

  it("shows export diagnostics in the unified panel", async () => {
    mockConvertResponse();
    installDownloadSpies();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));

    await waitFor(() => {
      expect(screen.getAllByText("Изображение не было встроено.").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/docx\.image\.missingAsset/u).length).toBeGreaterThan(0);
  });

  it("shows config validation diagnostics from JSON mode in the unified panel", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "JSON-режим" }));
    fireEvent.change(screen.getByLabelText("JSON конфигурации"), {
      target: { value: "{\"version\": \"1.0.0\"}" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Применить JSON" }));

    expect(screen.getAllByText(/Поле "input" обязательно/u).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Код: config.validation.required").length).toBeGreaterThan(0);
  });

  it("shows frontend upload validation diagnostics in the unified panel", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Выбрать Markdown-файл"), {
      target: {
        files: [file("document.pdf", "%PDF")]
      }
    });

    expect(
      (
        await screen.findAllByText(
          "Формат файла не поддерживается. Разрешены: .md, .markdown, .txt."
        )
      ).length
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("frontend.upload.validation")).toBeInTheDocument();
  });

  it("preview update does not remove unrelated export diagnostics", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.fn((url: string | URL | Request) =>
      String(url).includes("/api/v1/convert")
        ? Promise.resolve(convertResponse())
        : Promise.resolve(previewResponse())
    );
    vi.stubGlobal("fetch", fetchSpy);
    installDownloadSpies();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));
    await flushPromises();
    await advancePreviewDebounce();

    expect(screen.getAllByText("Изображение не было встроено.").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("HTML был пропущен при предпросмотре.").length
    ).toBeGreaterThan(0);
  });

  it("export does not remove unrelated preview diagnostics", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.fn((url: string | URL | Request) =>
      String(url).includes("/api/v1/convert")
        ? Promise.resolve(convertResponse())
        : Promise.resolve(previewResponse())
    );
    vi.stubGlobal("fetch", fetchSpy);
    installDownloadSpies();
    render(<App />);

    await advancePreviewDebounce();
    fireEvent.click(screen.getByRole("button", { name: "Скачать DOCX" }));
    await flushPromises();

    expect(
      screen.getAllByText("HTML был пропущен при предпросмотре.").length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Изображение не было встроено.").length).toBeGreaterThan(0);
  });

  it("diagnostics panel does not break editor state", async () => {
    render(<App />);

    fireEvent.change(screen.getByRole("textbox", { name: "Markdown-текст" }), {
      target: { value: "# Текст сохраняется" }
    });
    fireEvent.change(screen.getByLabelText("Выбрать Markdown-файл"), {
      target: {
        files: [file("document.pdf", "%PDF")]
      }
    });

    await screen.findAllByText(
      "Формат файла не поддерживается. Разрешены: .md, .markdown, .txt."
    );
    expect(screen.getByRole("textbox", { name: "Markdown-текст" })).toHaveValue(
      "# Текст сохраняется"
    );
  });

  it("diagnostics panel does not break config state", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Размер страницы"), {
      target: { value: "A3" }
    });
    fireEvent.change(screen.getByLabelText("Выбрать Markdown-файл"), {
      target: {
        files: [file("document.pdf", "%PDF")]
      }
    });

    await screen.findAllByText(
      "Формат файла не поддерживается. Разрешены: .md, .markdown, .txt."
    );
    expect(screen.getByLabelText("Размер страницы")).toHaveValue("A3");
  });
});

async function advancePreviewDebounce() {
  await act(async () => {
    vi.advanceTimersByTime(400);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

function previewResponse(): Response {
  return jsonResponse({
    preview: {
      html: "<div>Preview</div>",
      css: ".md2docx-preview {}",
      metadata: { fidelity: "fast-preview" }
    },
    diagnostics: [
      {
        severity: "warning",
        code: "markdown.unsupportedHtml",
        message: "HTML был пропущен при предпросмотре."
      }
    ]
  });
}

function convertResponse(): Response {
  return new Response(new Blob([new Uint8Array([80, 75, 3, 4])], {
    type: DOCX_CONTENT_TYPE
  }), {
    status: 200,
    headers: {
      "content-type": DOCX_CONTENT_TYPE,
      "content-disposition": "attachment; filename=\"document.docx\"",
      "x-md2docx-diagnostics": encodeDiagnosticsHeader([
        {
          severity: "warning",
          code: "docx.image.missingAsset",
          message: "Изображение не было встроено."
        }
      ])
    }
  });
}

function mockConvertResponse() {
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(convertResponse())));
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

function installDownloadSpies() {
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:docx"),
    revokeObjectURL: vi.fn()
  });
}

function file(name: string, content: string): File {
  const candidate = new File([content], name, { type: "application/pdf" });
  Object.defineProperty(candidate, "text", {
    value: () => Promise.resolve(content)
  });
  return candidate;
}

function encodeDiagnosticsHeader(diagnostics: readonly unknown[]): string {
  const bytes = new TextEncoder().encode(JSON.stringify({ diagnostics }));
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}
