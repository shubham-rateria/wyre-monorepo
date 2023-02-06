import { Timestamp } from "./../../../lamport/index";
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

function getTokens(path: string) {
  const tokens = path.split("/").map(unescape);
  if (tokens[0] !== "") throw new Error(`Invalid JSON Pointer: ${path}`);
  return tokens;
}

export function evaluate(object: any, path: string): PointerEvaluation {
  const tokens = getTokens(path);

  let parent: any = null;
  let key = "";
  let value = object || undefined;
  for (let i = 1, l = tokens.length; i < l; i++) {
    parent = value;

    key = tokens[i];
    if (key == "__proto__" || key == "constructor" || key == "prototype") {
      continue;
    }
    // not sure if this the best way to handle non-existant paths...
    if (parent) {
      value = parent[key];
    }
    // value = (parent || {})[key];
  }

  return { parent, key, value };
}

function add(object: any, operation: TPatch) {
  const pointer = evaluate(object, operation.path);

  console.log("[patch:add]", object);

  // @ts-ignore
  const timestamp = new Timestamp(operation.actorId, operation.seq);
  // @ts-ignore
  object.setKeyValueFromPatch(
    pointer.key,
    operation.value,
    timestamp.timestamp
  );
}

function remove(object: typeof ObservableObject, operation: TPatch) {
  const timestamp = new Timestamp(operation.actorId, operation.seq);
  const pointer = evaluate(object, operation.path);

  // @ts-ignore
  object.deleteKeyFromPatch(pointer.key, timestamp);
}

function replace(object: typeof ObservableObject, operation: TPatch) {
  const pointer = evaluate(object, operation.path);

  // @ts-ignore
  const timestamp = new Timestamp(operation.actorId, operation.seq);
  // @ts-ignore
  object.setKeyValueFromPatch(
    pointer.key,
    operation.value,
    timestamp.timestamp
  );
}

export function apply(
  object: any,
  operation: TPatch
): null | string | number | InvalidOperationError | void {
  // not sure why TypeScript can't infer typesafety of:
  //   {add, remove, replace, move, copy, test}[operation.op](object, operation)
  // (seems like a bug)

  const { parent, value, key } = evaluate(object, operation.path);
  const patch: TPatch = operation;
  patch.path = `/${key}`;

  if (parent instanceof ObservableObject) {
    switch (patch.op) {
      case "add":
        // @ts-ignore
        return add(parent, patch);
      case "remove":
        // @ts-ignore
        return remove(parent, patch);
      case "replace":
        // @ts-ignore
        return replace(parent, patch);
    }
  } else {
    parent.applyPatch(patch);
  }

  return new InvalidOperationError(operation);
}
