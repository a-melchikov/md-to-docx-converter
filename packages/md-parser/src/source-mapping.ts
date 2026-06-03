import type { DocumentPath, SourceLocation } from "@md-to-docx/domain";
import type { Position } from "unist";

export interface SourceMappingContext {
  readonly fileName?: string;
}

export const sourceFromPosition = (
  position: Position | undefined,
  context: SourceMappingContext
): SourceLocation | undefined => {
  if (position === undefined) {
    return undefined;
  }

  const startOffset = position.start.offset;
  const endOffset = position.end.offset;
  const length =
    startOffset === undefined || endOffset === undefined
      ? undefined
      : Math.max(0, endOffset - startOffset);

  const source: SourceLocation = {
    start: {
      line: position.start.line,
      column: position.start.column,
      ...(startOffset === undefined ? {} : { offset: startOffset })
    },
    end: {
      line: position.end.line,
      column: position.end.column,
      ...(endOffset === undefined ? {} : { offset: endOffset })
    },
    ...(context.fileName === undefined ? {} : { file: context.fileName }),
    ...(startOffset === undefined ? {} : { offset: startOffset }),
    ...(length === undefined ? {} : { length })
  };

  return source;
};

export const rootPath = (): DocumentPath => [
  {
    type: "root",
    name: "document"
  }
];

export const childPath = (
  parentPath: DocumentPath,
  field: string,
  index: number
): DocumentPath => [
  ...parentPath,
  {
    type: "field",
    name: field
  },
  {
    type: "index",
    index
  }
];
