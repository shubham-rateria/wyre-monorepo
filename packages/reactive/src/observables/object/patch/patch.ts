import { TPatch } from "../../../types/patch.type";
import ObservableObject from "../observable-object";

export class InvalidOperationError extends Error {
  constructor(public operation: TPatch) {
    super(`Invalid operation: ${operation.op}`);
    this.name = "InvalidOperationError";
  }
}

interface PointerEvaluation {
  parent: any;
  key: string;
  value: any;
}

function unescape(token: string): string {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

function evaluate(
  object: typeof ObservableObject,
  path: string
): PointerEvaluation {
  const tokens = path.split("/").map(unescape);
  if (tokens[0] !== "") throw new Error(`Invalid JSON Pointer: ${path}`);

  let parent: any = null;
  let key = "";
  let value = object || undefined;
  for (let i = 1, l = tokens.length; i < l; i++) {
    parent = value;
    key = this.tokens[i];
    if (key == "__proto__" || key == "constructor" || key == "prototype") {
      continue;
    }
    // not sure if this the best way to handle non-existant paths...
    if (parent) {
      value = parent.getValueForPointer(key);
    }
    // value = (parent || {})[key]
  }
  return { parent, key, value };
}

export function apply(object: any, operation: TPatch): null | string | number {
  // not sure why TypeScript can't infer typesafety of:
  //   {add, remove, replace, move, copy, test}[operation.op](object, operation)
  // (seems like a bug)
  switch (operation.op) {
    case "add":
      return add(object, operation);
    case "remove":
      return remove(object, operation);
    case "replace":
      return replace(object, operation);
  }
  return new InvalidOperationError(operation);
}
