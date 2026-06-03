import type { ConversionConfig, StyleDefinition } from "@md-to-docx/config-schema";
import type {
  BlockNode,
  Diagnostic,
  DocumentNode,
  InlineNode,
  ListItemNode,
  ResolvedBlockNode,
  ResolvedDocument,
  ResolvedDocumentProperties,
  ResolvedInlineNode,
  ResolvedListItemNode,
  ResolvedNumberingInfo,
  ResolvedNumberingLevel,
  ResolvedStyleSet,
  ResolvedTableCellNode,
  ResolvedTableRowNode,
  SourceLocation,
  DocumentPath
} from "@md-to-docx/domain";
import { twip } from "@md-to-docx/domain";

import { directStyleFromAttrs, mergeStyleSets, resolveStyleCascade } from "./cascade.js";
import {
  createStyleDiagnostic,
  invalidStyleMessage,
  missingStyleMessage,
  unsupportedNodeMessage,
  unitConversionErrorMessage
} from "./diagnostics.js";
import { fallbackStyleForKey } from "./fallback-styles.js";
import {
  blockStyleKey,
  inlineStyleKey,
  intrinsicInlineStyle,
  tableCellStyleKey,
  type StyleKey
} from "./mappings.js";
import { sanitizeXmlText } from "./xml-sanitizer.js";

export interface ResolveStylesInput {
  readonly document: DocumentNode;
  readonly config: ConversionConfig;
}

export interface ResolveStylesResult {
  readonly document: ResolvedDocument;
  readonly diagnostics: readonly Diagnostic[];
}

interface ResolveContext {
  readonly config: ConversionConfig;
  readonly diagnostics: Diagnostic[];
}

interface ListContext {
  readonly kind: "ordered" | "unordered";
  readonly level: number;
  readonly itemIndex?: number | undefined;
  readonly checked?: boolean | null | undefined;
}

export const resolveStyles = (
  input: ResolveStylesInput
): ResolveStylesResult => {
  const diagnostics: Diagnostic[] = [];
  const context: ResolveContext = {
    config: input.config,
    diagnostics
  };
  const document: ResolvedDocument = {
    kind: "document",
    sourceKind: "document",
    path: input.document.path,
    source: input.document.source,
    attrs: input.document.attrs,
    metadata: input.document.metadata,
    style: {},
    properties: resolveDocumentProperties(input.config, diagnostics),
    children: input.document.children.map((child) =>
      resolveBlockNode(child, context, 0)
    )
  };

  return {
    document,
    diagnostics
  };
};

const resolveBlockNode = (
  node: BlockNode,
  context: ResolveContext,
  listDepth: number,
  listContext?: ListContext | undefined,
  tableCellContext?: { readonly isHeader: boolean } | undefined
): ResolvedBlockNode => {
  switch (node.kind) {
    case "paragraph":
    {
      const style = styleForBlock(node, context);

      return {
        kind: "paragraph",
        sourceKind: node.kind,
        ...nodeBase(node),
        style,
        children: resolveInlineChildren(
          node.children,
          context,
          style.run
        )
      };
    }
    case "heading": {
      const style = styleForBlock(node, context);

      return {
        kind: "heading",
        sourceKind: node.kind,
        ...nodeBase(node),
        level: node.level,
        style,
        children: resolveInlineChildren(node.children, context, style.run)
      };
    }
    case "blockquote":
      return {
        kind: "blockquote",
        sourceKind: node.kind,
        ...nodeBase(node),
        style: styleForBlock(node, context),
        children: node.children.map((child) =>
          resolveBlockNode(child, context, listDepth)
        )
      };
    case "unordered-list": {
      const numbering = numberingInfoForList("unordered", listDepth, context);

      return {
        kind: "unordered-list",
        sourceKind: node.kind,
        ...nodeBase(node),
        style: styleForBlock(node, context),
        numbering,
        children: node.children.map((child, index) =>
          resolveListItem(child, context, listDepth, {
            ...numbering,
            itemIndex: index,
            checked: child.checked
          })
        )
      };
    }
    case "ordered-list": {
      const numbering = numberingInfoForList("ordered", listDepth, context);

      return {
        kind: "ordered-list",
        sourceKind: node.kind,
        ...nodeBase(node),
        ...(node.start === undefined ? {} : { start: node.start }),
        style: styleForBlock(node, context),
        numbering,
        children: node.children.map((child, index) =>
          resolveListItem(child, context, listDepth, {
            ...numbering,
            itemIndex: index,
            checked: child.checked
          })
        )
      };
    }
    case "list-item":
      return resolveListItem(node, context, listDepth, listContext);
    case "code-block": {
      const style = styleForBlock(node, context);
      const sanitized = sanitizeXmlText({
        value: node.value,
        policy: context.config.input.onInvalidXmlChar,
        source: node.source,
        path: node.path
      });
      context.diagnostics.push(...sanitized.diagnostics);

      return {
        kind: "code-block",
        sourceKind: node.kind,
        ...nodeBase(node),
        style,
        value: sanitized.value,
        ...(node.language === undefined ? {} : { language: node.language })
      };
    }
    case "thematic-break":
      return {
        kind: "thematic-break",
        sourceKind: node.kind,
        ...nodeBase(node),
        style: styleForBlock(node, context)
      };
    case "table":
      return {
        kind: "table",
        sourceKind: node.kind,
        ...nodeBase(node),
        style: styleForBlock(node, context),
        ...(node.align === undefined ? {} : { align: node.align }),
        children: node.children.map((row, index) =>
          resolveTableRow(row, context, index === 0)
        )
      };
    case "table-row":
      return resolveTableRow(node, context, tableCellContext?.isHeader ?? false);
    case "table-cell":
      return resolveTableCell(node, context, tableCellContext?.isHeader ?? false);
    case "image-block":
      return {
        kind: "image-block",
        sourceKind: node.kind,
        ...nodeBase(node),
        style: styleForBlock(node, context),
        src: node.src,
        ...(node.alt === undefined ? {} : { alt: node.alt }),
        ...(node.title === undefined ? {} : { title: node.title })
      };
    case "unsupported-block":
      context.diagnostics.push(
        createStyleDiagnostic({
          severity: "warning",
          code: "style.unsupportedNode",
          message: unsupportedNodeMessage(node.originalType),
          source: node.source,
          path: node.path,
          metadata: { nodeKind: node.kind, originalType: node.originalType }
        })
      );

      return {
        kind: "unsupported-block",
        sourceKind: node.kind,
        ...nodeBase(node),
        style: fallbackStyle(context.config.defaults, context, node.path, node.source),
        originalType: node.originalType,
        ...(node.reason === undefined ? {} : { reason: node.reason }),
        ...(node.fallbackText === undefined
          ? {}
          : { fallbackText: node.fallbackText })
      };
  }
};

const resolveListItem = (
  node: ListItemNode,
  context: ResolveContext,
  listDepth: number,
  listContext?: ListContext | undefined
): ResolvedListItemNode => {
  const numbering =
    listContext === undefined
      ? undefined
      : {
          ...numberingInfoForList(listContext.kind, listContext.level, context),
          ...(listContext.itemIndex === undefined
            ? {}
            : { itemIndex: listContext.itemIndex }),
          ...(listContext.checked === undefined
            ? {}
            : { checked: listContext.checked })
        };

  return {
    kind: "list-item",
    sourceKind: node.kind,
    ...nodeBase(node),
    ...(node.checked === undefined ? {} : { checked: node.checked }),
    ...(numbering === undefined ? {} : { numbering }),
    style: styleForBlock(node, context),
    children: node.children.map((child) =>
      resolveBlockNode(child, context, listDepth + 1)
    )
  };
};

const resolveTableRow = (
  node: Extract<BlockNode, { readonly kind: "table-row" }>,
  context: ResolveContext,
  isHeader: boolean
): ResolvedTableRowNode => ({
  kind: "table-row",
  sourceKind: node.kind,
  ...nodeBase(node),
  style: {},
  children: node.children.map((cell) => resolveTableCell(cell, context, isHeader))
});

const resolveTableCell = (
  node: Extract<BlockNode, { readonly kind: "table-cell" }>,
  context: ResolveContext,
  isHeader: boolean
): ResolvedTableCellNode => {
  const style = styleForKey(
    tableCellStyleKey(isHeader),
    context,
    node.path,
    node.source,
    directStyleFromAttrs(node.attrs)
  );

  return {
    kind: "table-cell",
    sourceKind: node.kind,
    ...nodeBase(node),
    isHeader,
    style,
    children: node.children.map((child) =>
      resolveBlockNode(child, context, 0, undefined, { isHeader })
    )
  };
};

const resolveInlineChildren = (
  children: readonly InlineNode[],
  context: ResolveContext,
  inheritedRun: ResolvedStyleSet["run"]
): readonly ResolvedInlineNode[] =>
  children.map((child) => resolveInlineNode(child, context, inheritedRun));

const resolveInlineNode = (
  node: InlineNode,
  context: ResolveContext,
  inheritedRun: ResolvedStyleSet["run"]
): ResolvedInlineNode => {
  const style = styleForInline(node, context, inheritedRun);

  switch (node.kind) {
    case "text": {
      const sanitized = sanitizeXmlText({
        value: node.value,
        policy: context.config.input.onInvalidXmlChar,
        source: node.source,
        path: node.path
      });
      context.diagnostics.push(...sanitized.diagnostics);

      return {
        kind: "text",
        sourceKind: node.kind,
        ...nodeBase(node),
        style,
        value: sanitized.value
      };
    }
    case "strong":
      return {
        kind: "strong",
        sourceKind: node.kind,
        ...nodeBase(node),
        style,
        children: resolveInlineChildren(node.children, context, style.run)
      };
    case "emphasis":
      return {
        kind: "emphasis",
        sourceKind: node.kind,
        ...nodeBase(node),
        style,
        children: resolveInlineChildren(node.children, context, style.run)
      };
    case "strikethrough":
      return {
        kind: "strikethrough",
        sourceKind: node.kind,
        ...nodeBase(node),
        style,
        children: resolveInlineChildren(node.children, context, style.run)
      };
    case "inline-code": {
      const sanitized = sanitizeXmlText({
        value: node.value,
        policy: context.config.input.onInvalidXmlChar,
        source: node.source,
        path: node.path
      });
      context.diagnostics.push(...sanitized.diagnostics);

      return {
        kind: "inline-code",
        sourceKind: node.kind,
        ...nodeBase(node),
        style,
        value: sanitized.value
      };
    }
    case "link":
      return {
        kind: "link",
        sourceKind: node.kind,
        ...nodeBase(node),
        style,
        href: node.href,
        ...(node.title === undefined ? {} : { title: node.title }),
        children: resolveInlineChildren(node.children, context, style.run)
      };
    case "inline-image":
      return {
        kind: "inline-image",
        sourceKind: node.kind,
        ...nodeBase(node),
        style,
        src: node.src,
        ...(node.alt === undefined ? {} : { alt: node.alt }),
        ...(node.title === undefined ? {} : { title: node.title })
      };
    case "hard-break":
      return {
        kind: "hard-break",
        sourceKind: node.kind,
        ...nodeBase(node),
        style
      };
    case "soft-break":
      return {
        kind: "soft-break",
        sourceKind: node.kind,
        ...nodeBase(node),
        style
      };
    case "unsupported-inline":
      context.diagnostics.push(
        createStyleDiagnostic({
          severity: "warning",
          code: "style.unsupportedNode",
          message: unsupportedNodeMessage(node.originalType),
          source: node.source,
          path: node.path,
          metadata: { nodeKind: node.kind, originalType: node.originalType }
        })
      );

      return {
        kind: "unsupported-inline",
        sourceKind: node.kind,
        ...nodeBase(node),
        style,
        originalType: node.originalType,
        ...(node.reason === undefined ? {} : { reason: node.reason }),
        ...(node.fallbackText === undefined
          ? {}
          : { fallbackText: node.fallbackText })
      };
  }
};

const styleForBlock = (
  node: BlockNode,
  context: ResolveContext
): ResolvedStyleSet => {
  const styleKey = blockStyleKey(node);

  return styleKey === undefined
    ? fallbackStyle(context.config.defaults, context, node.path, node.source)
    : styleForKey(
        styleKey,
        context,
        node.path,
        node.source,
        directStyleFromAttrs(node.attrs)
      );
};

const styleForInline = (
  node: InlineNode,
  context: ResolveContext,
  inheritedRun: ResolvedStyleSet["run"]
): ResolvedStyleSet => {
  const styleKey = inlineStyleKey(node);
  const inherited = inheritedRun === undefined ? {} : { run: inheritedRun };
  const style =
    styleKey === undefined
      ? resolveStyleCascade({
          defaults: context.config.defaults,
          markdownStyle: intrinsicInlineStyle(node),
          directStyle: directStyleFromAttrs(node.attrs),
          source: node.source,
          path: node.path,
          diagnostics: context.diagnostics,
          includeDefaults: false
        })
      : styleForKey(
          styleKey,
          context,
          node.path,
          node.source,
          directStyleFromAttrs(node.attrs),
          intrinsicInlineStyle(node),
          false
        );

  return mergeStyleSets(inherited, style);
};

const styleForKey = (
  styleKey: StyleKey,
  context: ResolveContext,
  path: DocumentPath | undefined,
  source: SourceLocation | undefined,
  directStyle?: StyleDefinition | undefined,
  markdownStyle?: StyleDefinition | undefined,
  includeDefaults = true
): ResolvedStyleSet => {
  const namedStyle = getNamedStyle(styleKey, context, path, source);

  return resolveStyleCascade({
    defaults: context.config.defaults,
    namedStyle,
    markdownStyle,
    directStyle,
    path,
    source,
    diagnostics: context.diagnostics,
    includeDefaults
  });
};

const getNamedStyle = (
  styleKey: StyleKey,
  context: ResolveContext,
  path: DocumentPath | undefined,
  source: SourceLocation | undefined
): StyleDefinition => {
  const styles = context.config.styles as unknown as Record<string, unknown>;
  const style = styles[styleKey];

  if (style === undefined) {
    context.diagnostics.push(
      createStyleDiagnostic({
        severity: "warning",
        code: "style.missing",
        message: missingStyleMessage(styleKey),
        source,
        path,
        metadata: { styleKey }
      })
    );

    return fallbackStyleForKey(styleKey);
  }

  if (!isRecord(style)) {
    context.diagnostics.push(
      createStyleDiagnostic({
        severity: "warning",
        code: "style.invalid",
        message: invalidStyleMessage(styleKey),
        source,
        path,
        metadata: { styleKey }
      })
    );

    return fallbackStyleForKey(styleKey);
  }

  return style as StyleDefinition;
};

const fallbackStyle = (
  defaults: ConversionConfig["defaults"],
  context: ResolveContext,
  path: DocumentPath | undefined,
  source: SourceLocation | undefined
): ResolvedStyleSet => {
  context.diagnostics.push(
    createStyleDiagnostic({
      severity: "warning",
      code: "style.fallback",
      message: "Использован fallback-стиль.",
      source,
      path
    })
  );

  return resolveStyleCascade({
    defaults,
    path,
    source,
    diagnostics: context.diagnostics
  });
};

const numberingInfoForList = (
  kind: "ordered" | "unordered",
  level: number,
  context: ResolveContext
): ResolvedNumberingInfo => {
  const levels = context.config.numbering[kind === "ordered" ? "ordered" : "unordered"].levels;
  const levelConfig = levels[level] ?? levels[levels.length - 1];

  return {
    kind,
    level,
    ...(levelConfig === undefined
      ? {}
      : { levelConfig: resolveNumberingLevel(levelConfig, context) })
  };
};

const resolveNumberingLevel = (
  level: ConversionConfig["numbering"]["ordered"]["levels"][number],
  context: ResolveContext
): ResolvedNumberingLevel => ({
  level: level.level,
  format: level.format,
  text: level.text,
  ...(level.start === undefined ? {} : { start: level.start }),
  leftTwip: convertDocumentUnit(
    level.leftTwip,
    "numbering.level.leftTwip",
    "Twip",
    twip,
    context.diagnostics
  ),
  hangingTwip: convertDocumentUnit(
    level.hangingTwip,
    "numbering.level.hangingTwip",
    "Twip",
    twip,
    context.diagnostics
  )
});

const resolveDocumentProperties = (
  config: ConversionConfig,
  diagnostics: Diagnostic[]
): ResolvedDocumentProperties => ({
  page: {
    size: {
      preset: config.document.page.size.preset,
      orientation: config.document.page.size.orientation,
      ...(config.document.page.size.widthTwip === undefined
        ? {}
        : {
            widthTwip: convertDocumentUnit(
              config.document.page.size.widthTwip,
              "document.page.size.widthTwip",
              "Twip",
              twip,
              diagnostics
            )
          }),
      ...(config.document.page.size.heightTwip === undefined
        ? {}
        : {
            heightTwip: convertDocumentUnit(
              config.document.page.size.heightTwip,
              "document.page.size.heightTwip",
              "Twip",
              twip,
              diagnostics
            )
          })
    },
    margin: {
      topTwip: convertDocumentUnit(
        config.document.page.margin.topTwip,
        "document.page.margin.topTwip",
        "Twip",
        twip,
        diagnostics
      ),
      rightTwip: convertDocumentUnit(
        config.document.page.margin.rightTwip,
        "document.page.margin.rightTwip",
        "Twip",
        twip,
        diagnostics
      ),
      bottomTwip: convertDocumentUnit(
        config.document.page.margin.bottomTwip,
        "document.page.margin.bottomTwip",
        "Twip",
        twip,
        diagnostics
      ),
      leftTwip: convertDocumentUnit(
        config.document.page.margin.leftTwip,
        "document.page.margin.leftTwip",
        "Twip",
        twip,
        diagnostics
      )
    }
  },
  columns: {
    count: config.document.columns.count,
    ...(config.document.columns.spacingTwip === undefined
      ? {}
      : {
          spacingTwip: convertDocumentUnit(
            config.document.columns.spacingTwip,
            "document.columns.spacingTwip",
            "Twip",
            twip,
            diagnostics
          )
        })
  },
  metadata: { ...config.document.metadata }
});

const convertDocumentUnit = <TUnit>(
  value: number,
  field: string,
  unit: string,
  factory: (value: number) => TUnit,
  diagnostics: Diagnostic[]
): TUnit => {
  try {
    return factory(value);
  } catch (error) {
    diagnostics.push(
      createStyleDiagnostic({
        severity: "warning",
        code: "style.unitConversionError",
        message: unitConversionErrorMessage(field, unit),
        metadata: {
          field,
          unit,
          value,
          error:
            error instanceof Error ? error.message : "Unknown unit conversion error"
        }
      })
    );

    return factory(0);
  }
};

const nodeBase = (
  node: BlockNode | InlineNode
): {
  readonly source?: SourceLocation | undefined;
  readonly path?: DocumentPath | undefined;
  readonly attrs?: BlockNode["attrs"] | undefined;
} => ({
  ...(node.source === undefined ? {} : { source: node.source }),
  ...(node.path === undefined ? {} : { path: node.path }),
  ...(node.attrs === undefined ? {} : { attrs: node.attrs })
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
