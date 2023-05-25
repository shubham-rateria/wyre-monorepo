import ObservableArray from "./observable-array";
import { ObservableObject } from "../object/observable-object";

describe("test for array", () => {
  test("array:push:new", async () => {
    const arr = new ObservableArray({
      items: [],
      onChange: () => {},
      actorId: "",
      collectionName: "",
      emitPatch: (patch) => {},
      onLocalChange: () => {},
    });
    for (let i = 0; i < 10; i++) {
      arr.push(i);
      expect(arr[arr.length - 1]).toBe(i);
      expect(arr.length).toBe(i + 1);
    }
  });
});
