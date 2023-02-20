import { ObservableObject } from "../object/observable-object";
import filterObject from "./filter-object";
describe("filter object test", () => {
  test("1", () => {
    const obj = new ObservableObject(
      { key: "value", something: "value" },
      () => {}
    );
    obj.delete("key");
    const keys = Array.from(obj.keys());
    console.log(keys);
  });
});
