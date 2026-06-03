import type {
  BlockNode,
  Diagnostic,
  DocumentNode,
  DocumentPath,
  HeadingLevel,
  InlineNode,
  ListItemNode,
  ParagraphNode,
  TableCellAlignment
} from "@md-to-docx/domain";
import type {
  BlockContent,
  Blockquote,
  Break,
  Code,
  Delete,
  Emphasis,
  Heading,
  Html,
  Image,
  InlineCode,
  Link,
  List,
  ListItem,
  Paragraph,
  PhrasingContent,
  Root,
  RootContent,
  Strong,
  Table,
  TableCell,
  TableRow,
  Text,
  ThematicBreak
} from "mdast";

import {
  createMarkdownDiagnostic,
  unsupportedHtmlMessage,
  unsupportedNodeMessage
} from "./diagnostics.js";
import type { ResolvedMarkdownParserOptions } from "./options.js";
import { plainTextFromNode, stripHtmlToText } from "./plain-text.js";
import {
  childPath,
  rootPath,
  sourceFromPosition,
  type SourceMappingContext
} from "./source-mapping.js";

export interface MdastToDocumentInput {
  readonly tree: Root;
  readonly options: ResolvedMarkdownParserOptions;
  readonly fileName?: string;
}

export interface MdastToDocumentResult {
  readonly document: DocumentNode;
  readonly diagnostics: readonly Diagnostic[];
}

interface MappingContext {
  readonly options: ResolvedMarkdownParserOptions;
  readonly source: SourceMappingContext;
  readonly diagnostics: Diagnostic[];
}

export const mdastToDocument = (
  input: MdastToDocumentInput
): MdastToDocumentResult => {
  const context: MappingContext = {
    options: input.options,
    source: {
      ...(input.fileName === undefined ? {} : { fileName: input.fileName })
    },
    diagnostics: []
  };
  const path = rootPath();
  const children = mapBlockChildren(input.tree.children, path, context);
  const document: DocumentNode = {
    kind: "document",
    children,
    path,
    ...(sourceFromPosition(input.tree.position, context.source) === undefined
      ? {}
      : { source: sourceFromPosition(input.tree.position, context.source) })
  };

  return {
    document,
    diagnostics: context.diagnostics
  };
};

const mapBlockChildren = (
  children: readonly RootContent[],
  parentPath: DocumentPath,
  context: MappingContext
): readonly BlockNode[] =>
  children.flatMap((child, index) =>
    mapBlockNode(child, childPath(parentPath, "children", index), context)
  );

const mapBlockNode = (
  node: RootContent | BlockContent,
  path: DocumentPath,
  context: MappingContext
): readonly BlockNode[] => {
  switch (node.type) {
    case "paragraph":
      return [mapParagraph(node, path, context)];
    case "heading":
      return [mapHeading(node, path, context)];
    case "blockquote":
      return [mapBlockquote(node, path, context)];
    case "list":
      return [mapList(node, path, context)];
    case "listItem":
      return [mapListItem(node, path, context)];
    case "code":
      return [mapCodeBlock(node, path, context)];
    case "thematicBreak":
      return [mapThematicBreak(node, path, context)];
    case "table":
      return [mapTable(node, path, context)];
    case "html":
      return mapHtmlBlock(node, path, context);
    case "definition":
    case "footnoteDefinition":
    case "yaml":
    default:
      return mapUnsupportedBlock(node, path, context);
  }
};

const mapParagraph = (
  node: Paragraph,
  path: DocumentPath,
  context: MappingContext
): ParagraphNode => ({
  kind: "paragraph",
  children: mapInlineChildren(node.children, path, context),
  path,
  ...(sourceFromPosition(node.position, context.source) === undefined
    ? {}
    : { source: sourceFromPosition(node.position, context.source) })
});

const mapHeading = (
  node: Heading,
  path: DocumentPath,
  context: MappingContext
): BlockNode => ({
  kind: "heading",
  level: node.depth as HeadingLevel,
  children: mapInlineChildren(node.children, path, context),
  path,
  ...(sourceFromPosition(node.position, context.source) === undefined
    ? {}
    : { source: sourceFromPosition(node.position, context.source) })
});

const mapBlockquote = (
  node: Blockquote,
  path: DocumentPath,
  context: MappingContext
): BlockNode => ({
  kind: "blockquote",
  children: mapBlockChildren(node.children, path, context),
  path,
  ...(sourceFromPosition(node.position, context.source) === undefined
    ? {}
    : { source: sourceFromPosition(node.position, context.source) })
});

const mapList = (
  node: List,
  path: DocumentPath,
  context: MappingContext
): BlockNode => {
  const listItems = node.children.map((child, index) =>
    mapListItem(child, childPath(path, "children", index), context)
  );
  const common = {
    children: listItems,
    path,
    ...(sourceFromPosition(node.position, context.source) === undefined
      ? {}
      : { source: sourceFromPosition(node.position, context.source) })
  };

  return node.ordered === true
    ? {
        kind: "ordered-list",
        ...common,
        ...(node.start === null || node.start === undefined
          ? {}
          : { start: node.start })
      }
    : {
        kind: "unordered-list",
        ...common
      };
};

const mapListItem = (
  node: ListItem,
  path: DocumentPath,
  context: MappingContext
): ListItemNode => ({
  kind: "list-item",
  children: mapBlockChildren(node.children, path, context),
  path,
  ...(node.checked === null || node.checked === undefined
    ? {}
    : { checked: node.checked }),
  ...(sourceFromPosition(node.position, context.source) === undefined
    ? {}
    : { source: sourceFromPosition(node.position, context.source) })
});

const mapCodeBlock = (
  node: Code,
  path: DocumentPath,
  context: MappingContext
): BlockNode => ({
  kind: "code-block",
  value: node.value,
  path,
  ...(node.lang === null || node.lang === undefined ? {} : { language: node.lang }),
  ...(sourceFromPosition(node.position, context.source) === undefined
    ? {}
    : { source: sourceFromPosition(node.position, context.source) })
});

const mapThematicBreak = (
  node: ThematicBreak,
  path: DocumentPath,
  context: MappingContext
): BlockNode => ({
  kind: "thematic-break",
  path,
  ...(sourceFromPosition(node.position, context.source) === undefined
    ? {}
    : { source: sourceFromPosition(node.position, context.source) })
});

const mapTable = (
  node: Table,
  path: DocumentPath,
  context: MappingContext
): BlockNode => ({
  kind: "table",
  align: node.align?.map((align) => align ?? null) as
    | readonly (TableCellAlignment | null)[]
    | undefined,
  children: node.children.map((row, index) =>
    mapTableRow(row, childPath(path, "children", index), context)
  ),
  path,
  ...(sourceFromPosition(node.position, context.source) === undefined
    ? {}
    : { source: sourceFromPosition(node.position, context.source) })
});

const mapTableRow = (
  node: TableRow,
  path: DocumentPath,
  context: MappingContext
): BlockNode & { kind: "table-row" } => ({
  kind: "table-row",
  children: node.children.map((cell, index) =>
    mapTableCell(cell, childPath(path, "children", index), context)
  ),
  path,
  ...(sourceFromPosition(node.position, context.source) === undefined
    ? {}
    : { source: sourceFromPosition(node.position, context.source) })
});

const mapTableCell = (
  node: TableCell,
  path: DocumentPath,
  context: MappingContext
): BlockNode & { kind: "table-cell" } => {
  const paragraphPath = childPath(path, "children", 0);
  const paragraph: ParagraphNode = {
    kind: "paragraph",
    children: mapInlineChildren(node.children, paragraphPath, context),
    path: paragraphPath,
    ...(sourceFromPosition(node.position, context.source) === undefined
      ? {}
      : { source: sourceFromPosition(node.position, context.source) })
  };

  return {
    kind: "table-cell",
    children: [paragraph],
    path,
    ...(sourceFromPosition(node.position, context.source) === undefined
      ? {}
      : { source: sourceFromPosition(node.position, context.source) })
  };
};

const mapHtmlBlock = (
  node: Html,
  path: DocumentPath,
  context: MappingContext
): readonly BlockNode[] => {
  const policy = context.options.htmlPolicy;
  addHtmlDiagnostic(node, path, context, policy === "error" ? "error" : "warning");

  if (policy === "warn-and-skip") {
    return [];
  }

  if (policy === "fallback-text") {
    const text = stripHtmlToText(node.value);

    if (text.length === 0) {
      return [];
    }

    return [
      {
        kind: "paragraph",
        children: [
          {
            kind: "text",
            value: text,
            path: childPath(path, "children", 0),
            ...(sourceFromPosition(node.position, context.source) === undefined
              ? {}
              : { source: sourceFromPosition(node.position, context.source) })
          }
        ],
        path,
        ...(sourceFromPosition(node.position, context.source) === undefined
          ? {}
          : { source: sourceFromPosition(node.position, context.source) })
      }
    ];
  }

  return [
    {
      kind: "unsupported-block",
      originalType: "html",
      reason: "Raw HTML is not converted directly.",
      path,
      ...(sourceFromPosition(node.position, context.source) === undefined
        ? {}
        : { source: sourceFromPosition(node.position, context.source) })
    }
  ];
};

const mapUnsupportedBlock = (
  node: RootContent | BlockContent,
  path: DocumentPath,
  context: MappingContext
): readonly BlockNode[] => {
  const policy = context.options.onUnsupportedNode;
  addUnsupportedDiagnostic(node, path, context, policy === "error" ? "error" : "warning");

  if (policy === "warn-and-skip") {
    return [];
  }

  if (policy === "fallback-text") {
    const text = plainTextFromNode(node);

    if (text.length === 0) {
      return [];
    }

    return [
      {
        kind: "paragraph",
        children: [
          {
            kind: "text",
            value: text,
            path: childPath(path, "children", 0),
            ...(sourceFromPosition(node.position, context.source) === undefined
              ? {}
              : { source: sourceFromPosition(node.position, context.source) })
          }
        ],
        path,
        ...(sourceFromPosition(node.position, context.source) === undefined
          ? {}
          : { source: sourceFromPosition(node.position, context.source) })
      }
    ];
  }

  return [
    {
      kind: "unsupported-block",
      originalType: node.type,
      reason: "Unsupported Markdown block node.",
      path,
      ...(sourceFromPosition(node.position, context.source) === undefined
        ? {}
        : { source: sourceFromPosition(node.position, context.source) })
    }
  ];
};

const mapInlineChildren = (
  children: readonly PhrasingContent[],
  parentPath: DocumentPath,
  context: MappingContext
): readonly InlineNode[] =>
  children.flatMap((child, index) =>
    mapInlineNode(child, childPath(parentPath, "children", index), context)
  );

const mapInlineNode = (
  node: PhrasingContent,
  path: DocumentPath,
  context: MappingContext
): readonly InlineNode[] => {
  switch (node.type) {
    case "text":
      return splitTextNode(node, path, context);
    case "strong":
      return [mapStrong(node, path, context)];
    case "emphasis":
      return [mapEmphasis(node, path, context)];
    case "delete":
      return [mapDelete(node, path, context)];
    case "inlineCode":
      return [mapInlineCode(node, path, context)];
    case "link":
      return [mapLink(node, path, context)];
    case "image":
      return [mapImage(node, path, context)];
    case "break":
      return [mapBreak(node, path, context)];
    case "html":
      return mapHtmlInline(node, path, context);
    case "footnoteReference":
    default:
      return mapUnsupportedInline(node, path, context);
  }
};

const splitTextNode = (
  node: Text,
  path: DocumentPath,
  context: MappingContext
): readonly InlineNode[] => {
  const parts = node.value.split("\n");

  return parts.flatMap((part, index) => {
    const nodes: InlineNode[] = [];

    if (index > 0) {
      nodes.push({
        kind: "soft-break",
        path: childPath(path, "children", index * 2 - 1),
        ...(sourceFromPosition(node.position, context.source) === undefined
          ? {}
          : { source: sourceFromPosition(node.position, context.source) })
      });
    }

    if (part.length > 0) {
      nodes.push({
        kind: "text",
        value: part,
        path: childPath(path, "children", index * 2),
        ...(sourceFromPosition(node.position, context.source) === undefined
          ? {}
          : { source: sourceFromPosition(node.position, context.source) })
      });
    }

    return nodes;
  });
};

const mapStrong = (
  node: Strong,
  path: DocumentPath,
  context: MappingContext
): InlineNode => ({
  kind: "strong",
  children: mapInlineChildren(node.children, path, context),
  path,
  ...(sourceFromPosition(node.position, context.source) === undefined
    ? {}
    : { source: sourceFromPosition(node.position, context.source) })
});

const mapEmphasis = (
  node: Emphasis,
  path: DocumentPath,
  context: MappingContext
): InlineNode => ({
  kind: "emphasis",
  children: mapInlineChildren(node.children, path, context),
  path,
  ...(sourceFromPosition(node.position, context.source) === undefined
    ? {}
    : { source: sourceFromPosition(node.position, context.source) })
});

const mapDelete = (
  node: Delete,
  path: DocumentPath,
  context: MappingContext
): InlineNode => ({
  kind: "strikethrough",
  children: mapInlineChildren(node.children, path, context),
  path,
  ...(sourceFromPosition(node.position, context.source) === undefined
    ? {}
    : { source: sourceFromPosition(node.position, context.source) })
});

const mapInlineCode = (
  node: InlineCode,
  path: DocumentPath,
  context: MappingContext
): InlineNode => ({
  kind: "inline-code",
  value: node.value,
  path,
  ...(sourceFromPosition(node.position, context.source) === undefined
    ? {}
    : { source: sourceFromPosition(node.position, context.source) })
});

const mapLink = (
  node: Link,
  path: DocumentPath,
  context: MappingContext
): InlineNode => ({
  kind: "link",
  href: node.url,
  children: mapInlineChildren(node.children, path, context),
  path,
  ...(node.title === null || node.title === undefined ? {} : { title: node.title }),
  ...(sourceFromPosition(node.position, context.source) === undefined
    ? {}
    : { source: sourceFromPosition(node.position, context.source) })
});

const mapImage = (
  node: Image,
  path: DocumentPath,
  context: MappingContext
): InlineNode => ({
  kind: "inline-image",
  src: node.url,
  path,
  ...(node.alt === null || node.alt === undefined ? {} : { alt: node.alt }),
  ...(node.title === null || node.title === undefined ? {} : { title: node.title }),
  ...(sourceFromPosition(node.position, context.source) === undefined
    ? {}
    : { source: sourceFromPosition(node.position, context.source) })
});

const mapBreak = (
  node: Break,
  path: DocumentPath,
  context: MappingContext
): InlineNode => ({
  kind: "hard-break",
  path,
  ...(sourceFromPosition(node.position, context.source) === undefined
    ? {}
    : { source: sourceFromPosition(node.position, context.source) })
});

const mapHtmlInline = (
  node: Html,
  path: DocumentPath,
  context: MappingContext
): readonly InlineNode[] => {
  const policy = context.options.htmlPolicy;
  addHtmlDiagnostic(node, path, context, policy === "error" ? "error" : "warning");

  if (policy === "warn-and-skip") {
    return [];
  }

  if (policy === "fallback-text") {
    const text = stripHtmlToText(node.value);

    return text.length === 0
      ? []
      : [
          {
            kind: "text",
            value: text,
            path,
            ...(sourceFromPosition(node.position, context.source) === undefined
              ? {}
              : { source: sourceFromPosition(node.position, context.source) })
          }
        ];
  }

  return [
    {
      kind: "unsupported-inline",
      originalType: "html",
      reason: "Raw HTML is not converted directly.",
      path,
      ...(sourceFromPosition(node.position, context.source) === undefined
        ? {}
        : { source: sourceFromPosition(node.position, context.source) })
    }
  ];
};

const mapUnsupportedInline = (
  node: PhrasingContent,
  path: DocumentPath,
  context: MappingContext
): readonly InlineNode[] => {
  const policy = context.options.onUnsupportedNode;
  addUnsupportedDiagnostic(node, path, context, policy === "error" ? "error" : "warning");

  if (policy === "warn-and-skip") {
    return [];
  }

  if (policy === "fallback-text") {
    const text = plainTextFromNode(node);

    return text.length === 0
      ? []
      : [
          {
            kind: "text",
            value: text,
            path,
            ...(sourceFromPosition(node.position, context.source) === undefined
              ? {}
              : { source: sourceFromPosition(node.position, context.source) })
          }
        ];
  }

  return [
    {
      kind: "unsupported-inline",
      originalType: node.type,
      reason: "Unsupported Markdown inline node.",
      path,
      ...(sourceFromPosition(node.position, context.source) === undefined
        ? {}
        : { source: sourceFromPosition(node.position, context.source) })
    }
  ];
};

const addUnsupportedDiagnostic = (
  node: { readonly type: string; readonly position?: Root["position"] },
  path: DocumentPath,
  context: MappingContext,
  severity: "warning" | "error"
): void => {
  context.diagnostics.push(
    createMarkdownDiagnostic({
      severity,
      code: "markdown.unsupportedNode",
      message: unsupportedNodeMessage(
        node.type,
        context.options.onUnsupportedNode
      ),
      path,
      source: sourceFromPosition(node.position, context.source),
      metadata: {
        nodeType: node.type,
        policy: context.options.onUnsupportedNode
      }
    })
  );
};

const addHtmlDiagnostic = (
  node: Html,
  path: DocumentPath,
  context: MappingContext,
  severity: "warning" | "error"
): void => {
  context.diagnostics.push(
    createMarkdownDiagnostic({
      severity,
      code: "markdown.unsupportedHtml",
      message: unsupportedHtmlMessage(context.options.htmlPolicy),
      path,
      source: sourceFromPosition(node.position, context.source),
      metadata: {
        nodeType: node.type,
        policy: context.options.htmlPolicy
      }
    })
  );
};
