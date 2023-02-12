function unescape(token: string): string {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

export function getTokens(path: string) {
  const tokens = path.split("/").map(unescape);
  if (tokens[0] !== "") throw new Error(`Invalid JSON Pointer: ${path}`);
  return tokens;
}
