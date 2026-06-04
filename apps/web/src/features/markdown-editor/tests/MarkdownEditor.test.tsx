import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MarkdownEditor } from "../MarkdownEditor.js";
import {
  createExampleMarkdownDocument,
  type MarkdownDocumentState
} from "../markdown-document-state.js";

describe("MarkdownEditor", () => {
  it("renders a textarea with a Russian accessible label", () => {
    renderEditor();

    expect(
      screen.getByRole("textbox", { name: "Markdown-текст" })
    ).toBeInTheDocument();
  });

  it("allows the user to type Markdown", () => {
    const onChange = vi.fn();
    renderEditor({ onChange });

    fireEvent.change(screen.getByRole("textbox", { name: "Markdown-текст" }), {
      target: { value: "## Новый раздел" }
    });

    expect(onChange).toHaveBeenCalledWith("## Новый раздел");
  });

  it("updates the character counter from document state", () => {
    renderEditor({
      document: {
        content: "abc",
        source: "manual"
      }
    });

    expect(screen.getByText("3 символов")).toBeInTheDocument();
  });

  it("uses a two-step clear action to avoid accidental content loss", () => {
    const onClear = vi.fn();
    renderEditor({ onClear });

    fireEvent.click(screen.getByRole("button", { name: "Очистить" }));
    expect(onClear).not.toHaveBeenCalled();
    expect(
      screen.getByText("Нажмите «Подтвердить очистку», чтобы удалить текущий Markdown.")
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Подтвердить очистку" })
    );
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

interface RenderEditorOptions {
  readonly document?: MarkdownDocumentState;
  readonly onChange?: (content: string) => void;
  readonly onClear?: () => void;
  readonly onUpload?: (content: string, fileName: string) => void;
}

function renderEditor(options: RenderEditorOptions = {}) {
  return render(
    <section aria-labelledby="editor-heading">
      <MarkdownEditor
        document={options.document ?? createExampleMarkdownDocument()}
        onChange={options.onChange ?? vi.fn()}
        onClear={options.onClear ?? vi.fn()}
        onUpload={options.onUpload ?? vi.fn()}
      />
    </section>
  );
}
