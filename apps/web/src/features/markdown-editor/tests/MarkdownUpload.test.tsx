import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MarkdownUpload } from "../MarkdownUpload.js";
import { readMarkdownUpload } from "../markdown-input.validation.js";

describe("MarkdownUpload", () => {
  it("uploads a .md file and returns its content", async () => {
    const onUpload = vi.fn();
    renderUpload({ onUpload });

    fireEvent.change(screen.getByLabelText("Выбрать Markdown-файл"), {
      target: {
        files: [markdownFile("doc.md", "# Markdown")]
      }
    });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith("# Markdown", "doc.md");
    });
  });

  it("uploads a .markdown file and returns its content", async () => {
    const onUpload = vi.fn();
    renderUpload({ onUpload });

    fireEvent.change(screen.getByLabelText("Выбрать Markdown-файл"), {
      target: {
        files: [markdownFile("doc.markdown", "## Markdown")]
      }
    });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith("## Markdown", "doc.markdown");
    });
  });

  it("uploads a .txt file and returns its content", async () => {
    const onUpload = vi.fn();
    renderUpload({ onUpload });

    fireEvent.change(screen.getByLabelText("Выбрать Markdown-файл"), {
      target: {
        files: [markdownFile("notes.txt", "plain text", "text/plain")]
      }
    });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith("plain text", "notes.txt");
    });
  });

  it("shows the uploaded file name", () => {
    renderUpload({ fileName: "guide.md" });

    expect(screen.getByText("Файл: guide.md")).toBeInTheDocument();
  });

  it("shows a Russian error for unsupported file extension", async () => {
    renderUpload();

    fireEvent.change(screen.getByLabelText("Выбрать Markdown-файл"), {
      target: {
        files: [markdownFile("doc.pdf", "%PDF")]
      }
    });

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Формат файла не поддерживается. Разрешены: .md, .markdown, .txt.");
  });

  it("shows a Russian error for too large files before reading content", async () => {
    const onUpload = vi.fn();
    renderUpload({ onUpload });

    fireEvent.change(screen.getByLabelText("Выбрать Markdown-файл"), {
      target: {
        files: [largeMarkdownFile()]
      }
    });

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Размер файла превышает допустимый лимит.");
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("shows a Russian error for empty files", async () => {
    renderUpload();

    fireEvent.change(screen.getByLabelText("Выбрать Markdown-файл"), {
      target: {
        files: [markdownFile("empty.md", "")]
      }
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Файл пустой.");
  });

  it("rejects multiple files dropped into the drop zone", async () => {
    renderUpload();

    fireEvent.drop(screen.getByRole("button", { name: "Область загрузки Markdown-файла" }), {
      dataTransfer: {
        files: [
          markdownFile("one.md", "# One"),
          markdownFile("two.md", "# Two")
        ]
      }
    });

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Можно загрузить только один Markdown-файл.");
  });

  it("highlights the drop zone during drag over", () => {
    renderUpload();
    const dropZone = screen.getByRole("button", {
      name: "Область загрузки Markdown-файла"
    });

    fireEvent.dragOver(dropZone, {
      dataTransfer: {
        dropEffect: "none"
      }
    });

    expect(dropZone).toHaveClass("is-dragging");
  });

  it("uses the same validation logic for drag and drop", async () => {
    renderUpload();
    const dropZone = screen.getByRole("button", {
      name: "Область загрузки Markdown-файла"
    });

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [markdownFile("doc.exe", "bad")]
      }
    });

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Формат файла не поддерживается. Разрешены: .md, .markdown, .txt.");
  });
});

describe("readMarkdownUpload", () => {
  it("returns a Russian error when no file is selected", async () => {
    await expect(readMarkdownUpload(null)).resolves.toMatchObject({
      ok: false,
      error: {
        message: "Файл не выбран."
      }
    });
  });
});

interface RenderUploadOptions {
  readonly fileName?: string;
  readonly onUpload?: (content: string, fileName: string) => void;
}

function renderUpload(options: RenderUploadOptions = {}) {
  return render(
    <MarkdownUpload
      fileName={options.fileName}
      onUpload={options.onUpload ?? vi.fn()}
    />
  );
}

function markdownFile(
  name: string,
  content: string,
  type = "text/markdown"
): File {
  const file = new File([content], name, { type });
  Object.defineProperty(file, "text", {
    value: () => Promise.resolve(content)
  });
  return file;
}

function largeMarkdownFile(): File {
  const file = new File([new Uint8Array(1_048_577)], "large.md", {
    type: "text/markdown"
  });
  Object.defineProperty(file, "text", {
    value: () => Promise.resolve("# Large")
  });
  return file;
}
