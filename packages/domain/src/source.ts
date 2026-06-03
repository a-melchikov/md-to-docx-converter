export interface SourcePosition {
  readonly line?: number | undefined;
  readonly column?: number | undefined;
  readonly offset?: number | undefined;
}

export interface SourceLocation {
  readonly file?: string | undefined;
  readonly start?: SourcePosition | undefined;
  readonly end?: SourcePosition | undefined;
  readonly offset?: number | undefined;
  readonly length?: number | undefined;
}

export interface DocumentPathRootSegment {
  readonly type: "root";
  readonly name: "document";
}

export interface DocumentPathFieldSegment {
  readonly type: "field";
  readonly name: string;
}

export interface DocumentPathIndexSegment {
  readonly type: "index";
  readonly index: number;
}

export type DocumentPathSegment =
  | DocumentPathRootSegment
  | DocumentPathFieldSegment
  | DocumentPathIndexSegment;

export type DocumentPath = readonly DocumentPathSegment[];

export const documentPathRoot = (): DocumentPathRootSegment => ({
  type: "root",
  name: "document"
});

export const documentPathField = (name: string): DocumentPathFieldSegment => {
  if (name.length === 0) {
    throw new RangeError("Document path field name must not be empty.");
  }

  return {
    type: "field",
    name
  };
};

export const documentPathIndex = (index: number): DocumentPathIndexSegment => {
  if (!Number.isInteger(index) || index < 0) {
    throw new RangeError("Document path index must be a non-negative integer.");
  }

  return {
    type: "index",
    index
  };
};

export const pathToString = (path: DocumentPath): string =>
  path
    .map((segment, index) => {
      if (segment.type === "root") {
        return segment.name;
      }

      if (segment.type === "field") {
        return index === 0 ? segment.name : `.${segment.name}`;
      }

      return `[${segment.index}]`;
    })
    .join("");
