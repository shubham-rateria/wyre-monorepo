import ObservableArray from "../observable-array";
import { evaluate } from "./patch";

describe("test patches utils", () => {
  test("object parent", () => {
    const d = [1, 2, 3];
    const obs = new ObservableArray(d, () => {});
    const { parent } = evaluate(obs, "/0");
    console.log("test", typeof parent, parent);
    expect(parent).toBeInstanceOf(ObservableArray);
  });
});
