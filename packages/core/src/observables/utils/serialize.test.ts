import { ObservableObject } from "../object/observable-object";
import { serializeObject } from "./serialize";

describe("serialize", () => {
  test("object", () => {
    const obj = { key: "value", arr: [1, 2, 3], data: { key: "value" } };
    const obs = new ObservableObject(obj, () => {});
    console.log(JSON.stringify(serializeObject(obs), null, 4));
  });
});
