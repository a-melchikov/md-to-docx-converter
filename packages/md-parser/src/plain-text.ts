import { toString } from "mdast-util-to-string";
import type { Nodes } from "mdast";

export const plainTextFromNode = (node: Nodes): string => {
  if ("value" in node && typeof node.value === "string") {
    return node.type === "html" ? stripHtmlToText(node.value) : node.value;
  }

  return toString(node);
};

export const stripHtmlToText = (html: string): string =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
