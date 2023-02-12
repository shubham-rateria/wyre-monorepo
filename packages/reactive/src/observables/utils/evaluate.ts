import { getTokens } from "./get-tokens";

export interface PointerEvaluation {
  parent: any;
  key: string;
  value: any;
}

export function evaluate(object: any, path: string): PointerEvaluation {
  console.log("[evaluate:start]", object, path);
  const tokens = getTokens(path);

  let parent: any = null;
  let key = "";
  let value = object || undefined;
  for (let i = 1, l = tokens.length; i < l; i++) {
    console.log("[evaluate:token]", tokens[i]);
    parent = value;

    key = tokens[i];
    if (key == "__proto__" || key == "constructor" || key == "prototype") {
      continue;
    }
    // not sure if this the best way to handle non-existant paths...
    if (parent) {
      console.log(
        "[eval:object:tokens:before:query]",
        key,
        typeof parent,
        value
      );
      value = parent[key];
      console.log("[eval:object:tokens:after:query]", key, parent, value);
    }
    // value = (parent || {})[key];
    console.log("[eval:object:tokens]", tokens[i], parent, value);
  }

  return { parent, key, value };
}
