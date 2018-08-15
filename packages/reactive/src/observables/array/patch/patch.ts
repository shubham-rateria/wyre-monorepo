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

export function getTokens(path: string) {
  const tokens = path
    .split("/")
    .map(unescape)
    .filter((val) => val !== "");
  //   if (tokens[0] !== "") throw new Error(`Invalid JSON Pointer: ${path}`);
  return tokens;
}

export function convertIndexedToCrdtPath(
  object: typeof ObservableArray,
  patch: TPatch
) {
  let modPath = "";
  let parent: any = null;
  let value = object;
  const tokens = getTokens(patch.path);

  for (const token of tokens) {
    parent = value;

    if (parent instanceof ObservableArray) {
      /**
       * If parent is an observable array and key is not crdt key
       * then it has to be converted to crdt key
       */
      if (!Key.isCrdtKey(token)) {
        // @ts-ignore
        const key = parent.getRawValue(token).key.toString();
        modPath += "/" + key;
        value = parent[parseInt(token)];
        continue;
      }
      /**
       * Find the index
       */
      let index: number;

      if (patch.op === "replace") {
        // @ts-ignore
        index = value.crdtIndexToArrayIndex(token);
        if (!index) {
          throw new Error("could not find index" + token);
        }
      } else {
        // @ts-ignore
        index = value.findIndexToInsert(token);
      }

      modPath += "/" + token;

      /**
       * in case of adding to the end,
       * the parent[index] will be undefined
       */
      if (parent[index]) {
        value = parent[index].value;
      }
    } else {
      modPath += "/" + token;
      value = parent[token];
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

    // console.log("[eval]", typeof parent, parent, typeof value, value);
  }

  return { parent, key, value };
}

function add(object: typeof ObservableArray, operation: TPatch) {
  const pointer = evaluate(object, operation.path);

  // console.log("[patch:add]", object);

  // @ts-ignore
  const timestamp = new Timestamp(operation.actorId, operation.seq);
  // @ts-ignore
  object.addNewValueFromPatch(
    pointer.key,
    operation.value,
    timestamp.timestamp
  );
}

function remove(object: typeof ObservableArray, operation: TPatch) {
  const pointer = evaluate(object, operation.path);

  // console.log("[patch:deleting]", pointer, object, operation);

  // @ts-ignore
  const timestamp = new Timestamp(operation.actorId, operation.seq);
  // @ts-ignore
  object.deleteValueFromPatch(
    pointer.key,
    operation.value,
    timestamp.timestamp
  );
}

function replace(object: typeof ObservableArray, operation: TPatch) {
  const pointer = evaluate(object, operation.path);

  // console.log("[patch:replacing]", pointer, object, operation);

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

  const { parent, value, key } = evaluate(object, operation.path);
  const patch: TPatch = operation;
  patch.path = `/${key}`;

  // console.log("[apply]", typeof parent, patch);

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
