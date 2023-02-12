import { Timestamp } from "./../../../lamport/index";
import { TPatch } from "../../../types/patch.type";
import { ObservableObject } from "../observable-object";
import { getTokens } from "../../utils/get-tokens";
import { evaluate } from "../../utils/evaluate";

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
  console.log("[patch:delete]");

  const timestamp = new Timestamp(operation.actorId, operation.seq);

  console.log("[patch:delete:timestamp]", timestamp);

  const pointer = evaluate(object, operation.path);

  console.log("[patch:delete:pointer]", pointer);

  // @ts-ignore
  object.deleteKeyFromPatch(pointer.key, timestamp);
}

function replace(object: typeof ObservableObject, operation: TPatch) {
  const pointer = evaluate(object, operation.path);

  console.log("[patch:replace]", object, operation);

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

  console.log("[obejct:patch:eval:incoming]", object, operation);
  const { parent, value, key } = evaluate(object, operation.path);
  const patch: TPatch = operation;
  patch.path = `/${key}`;

  console.log(
    "[apply:object]",
    patch,
    parent,
    value,
    key,
    typeof parent,
    parent instanceof ObservableObject
  );

  if (parent instanceof ObservableObject) {
    console.log("[patch:object]: parent is object");
    switch (patch.op) {
      case "add":
        // @ts-ignore
        return add(parent, patch);
      case "remove":
        console.log("[patch:object]: parent is object: removing");
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
