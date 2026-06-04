export function fileNameFromContentDisposition(
  value: string | null
): string | undefined {
  if (value === null || value.trim().length === 0) {
    return undefined;
  }

  const encodedFileName = parameterValue(value, "filename*");
  if (encodedFileName !== undefined) {
    return decodeExtendedFileName(encodedFileName);
  }

  return parameterValue(value, "filename");
}

function parameterValue(
  contentDisposition: string,
  parameterName: string
): string | undefined {
  const parameters = contentDisposition.split(";").slice(1);
  const prefix = `${parameterName.toLowerCase()}=`;
  const parameter = parameters.find((candidate) =>
    candidate.trim().toLowerCase().startsWith(prefix)
  );

  if (parameter === undefined) {
    return undefined;
  }

  const rawValue = parameter.trim().slice(prefix.length).trim();
  return unquote(rawValue);
}

function decodeExtendedFileName(value: string): string | undefined {
  const parts = value.split("''");
  const encoded = parts.length === 2 ? parts[1] : value;

  if (encoded === undefined || encoded.length === 0) {
    return undefined;
  }

  try {
    return decodeURIComponent(encoded);
  } catch {
    return undefined;
  }
}

function unquote(value: string): string {
  if (value.startsWith("\"") && value.endsWith("\"")) {
    return value
      .slice(1, -1)
      .replace(/\\"/g, "\"")
      .replace(/\\\\/g, "\\");
  }

  return value;
}
