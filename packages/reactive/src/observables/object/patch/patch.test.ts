import ObservableObject from "../observable-object";
import { evaluate } from "./patch";

describe("test patches utils", () => {
  test("object parent", () => {
    const d = { key: "value" };
    const obs = new ObservableObject(d, () => {});
    const { parent } = evaluate(obs, "/key");
    console.log("test", typeof parent, parent);
    expect(parent).toBeInstanceOf(ObservableObject);
  });
});
