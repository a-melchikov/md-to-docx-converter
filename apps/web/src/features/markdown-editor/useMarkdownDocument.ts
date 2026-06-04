import { useCallback, useState } from "react";

import {
  createExampleMarkdownDocument,
  type MarkdownDocumentState
} from "./markdown-document-state.js";

export interface UseMarkdownDocumentResult {
  readonly document: MarkdownDocumentState;
  readonly updateContent: (content: string) => void;
  readonly clearContent: () => void;
  readonly replaceWithUploadedFile: (content: string, fileName: string) => void;
}

export function useMarkdownDocument(): UseMarkdownDocumentResult {
  const [document, setDocument] = useState<MarkdownDocumentState>(() =>
    createExampleMarkdownDocument()
  );

  const updateContent = useCallback((content: string) => {
    setDocument({
      content,
      lastUpdatedAt: new Date().toISOString(),
      source: "manual"
    });
  }, []);

  const clearContent = useCallback(() => {
    setDocument({
      content: "",
      lastUpdatedAt: new Date().toISOString(),
      source: "manual"
    });
  }, []);

  const replaceWithUploadedFile = useCallback(
    (content: string, fileName: string) => {
      setDocument({
        content,
        fileName,
        lastUpdatedAt: new Date().toISOString(),
        source: "upload"
      });
    },
    []
  );

  return {
    document,
    updateContent,
    clearContent,
    replaceWithUploadedFile
  };
}
