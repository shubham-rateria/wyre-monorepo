import { Timestamp } from "./../../../lamport/index";
import { TPatch } from "../../../types/patch.type";
import ObservableArray from "../observable-array";
import { Key } from "../key/key";

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
  const tokens = path
    .split("/")
    .map(unescape)
    .filter((val) => val !== "");
  //   if (tokens[0] !== "") throw new Error(`Invalid JSON Pointer: ${path}`);
  console.log("[getTokens]:getting tokens", tokens);
  return tokens;
}

export function convertPathToIndexed(
  object: typeof ObservableArray,
  patch: TPatch
) {
  /**
   * patch will be of the form
   *
   * op: "add" | "remove" | "insert" | "replace"
   * path: "/abcde$0.45"
   * value: 10
   * lamportTimestamp: 10
   *
   * In case of each operation,
   * we have to find the index where the path fits,
   * transpose, i.e., change the path to mean that index
   * and apply the patch
   *
   * Path may contain multiple keys where the path
   * is a CRDT key, we have to find each key and if
   * it is a CRDT key, find the index where the op
   * is to be applied and transpose
   *
   *
   */

  let modPath = "";
  let parent: any = null;
  let key = "";
  let value = object;
  const tokens = getTokens(patch.path);

  console.log("[convertingPath]", tokens, patch.path);

  for (const token of tokens) {
    console.log("[convertPathToIndex]:value", value);

    if (!Key.isCrdtKey(token)) {
      console.log("[convertPathToIndex]:is not crdt", token);
      modPath += "/" + token;
      parent = value;
      value = parent[key];
      continue;
    }
    /**
     * Find the index
     */

    let index: number;

    if (patch.op === "replace") {
      // @ts-ignore
      index = value.findIndex(token);
      console.log("[non crdt key]", index, token);
      if (!index) {
        throw new Error("could not find index" + token);
      }
    } else {
      // @ts-ignore
      index = value.getIndexFromCrdtKey(token);
    }

    modPath += "/" + index.toString();

    /**
     * parent[index] in this case has to be a crdt array
     */
    parent = value;

    /**
     * in case of adding to the end,
     * the parent[index] will be undefined
     */
    if (parent[index]) {
      value = parent[index].value;
    }
  }

  return modPath;
}

export function evaluate(object: any, path: string): PointerEvaluation {
  const tokens = getTokens(path);

  let parent: any = null;
  let key = "";
  let value = object || undefined;
  for (let i = 0, l = tokens.length; i < l; i++) {
    parent = value;

    key = tokens[i];
    if (key == "__proto__" || key == "constructor" || key == "prototype") {
      continue;
    }
    // not sure if this the best way to handle non-existant paths...
    value = (parent || {})[key];
  }

  return { parent, key, value };
}

function add(object: typeof ObservableArray, operation: TPatch) {
  const pointer = evaluate(object, operation.path);

  console.log("[patch:add]", object);

  // @ts-ignore
  const timestamp = new Timestamp(operation.actorId, operation.seq);
  // @ts-ignore
  object.setValueFromPatch(pointer.key, operation.value, timestamp.timestamp);
}

function remove(object: typeof ObservableArray, operation: TPatch) {}

function replace(object: typeof ObservableArray, operation: TPatch) {
  const pointer = evaluate(object, operation.path);

  // @ts-ignore
  const timestamp = new Timestamp(operation.actorId, operation.seq);
  // @ts-ignore
  object.setValueFromPatch(pointer.key, operation.value, timestamp.timestamp);
}

export function apply(
  object: any,
  operation: TPatch
): null | string | number | InvalidOperationError | void {
  // not sure why TypeScript can't infer typesafety of:
  //   {add, remove, replace, move, copy, test}[operation.op](object, operation)
  // (seems like a bug)

  const indexedPath = convertPathToIndexed(object, operation);
  console.log("[indexedPath]", indexedPath);
  const { parent, value, key } = evaluate(object, indexedPath);
  const patch: TPatch = operation;
  patch.path = `/${key}`;

  console.log("[apply]", typeof parent, patch);

  if (parent instanceof ObservableArray) {
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
