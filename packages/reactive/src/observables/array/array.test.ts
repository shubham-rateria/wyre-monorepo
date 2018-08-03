import ObservableObject from "../object/observable-object";
import ObservableArray from "./observable-array";
describe("tests for array", () => {
  test("create an array", async () => {
    const items = [1, 2, 3];
    const arr = new ObservableArray(items, () => {});
    expect(arr.length).toBe(items.length);
  });
  test("array:push:new", async () => {
    const arr = new ObservableArray([], () => {});
    arr.push(10);
    expect(arr[0]).toBe(10);
    expect(arr.length).toBe(1);
  });
  test("array:push:existing", async () => {
    const items = [1, 2, 3];
    const arr = new ObservableArray(items, () => {});
    arr.push(10);
    expect(arr[3]).toBe(10);
    expect(arr.length).toBe(items.length + 1);
  });
  test("array:push:multiple", async () => {
    const items = [1, 2, 3];
    const arr = new ObservableArray(items, () => {});
    const toAdd = 5;
    for (let i = 0; i < toAdd; i++) {
      arr.push(i);
      expect(arr[items.length + i]).toBe(i);
    }
    expect(arr.length).toBe(items.length + toAdd);
  });
  test("child:arr", () => {
    const items = [
      [1, 2, 3],
      [4, 5, 6],
    ];
    const arr = new ObservableArray(items, () => {});
    expect(arr[0]).toBeInstanceOf(ObservableArray);
  });
  test("child:object", () => {
    const items = [{ d: 1 }];
    const arr = new ObservableArray(items, () => {});
    expect(arr[0]).toBeInstanceOf(ObservableObject);
  });
  test("patch:replace", () => {
    const patch = {
      op: "replace",
      path: "/$0.3",
      value: 10,
      lamportTimestamp: 10,
    };
    const items = [1, 2, 3];
    const arr = new ObservableArray(items, console.log);
    arr.applyPatch(patch);
    expect(arr[1]).toBe(10);
  }),
    test("patch:add", () => {
      const patch = {
        op: "add",
        path: "/$0.8",
        value: 10,
        lamportTimestamp: 10,
      };
      const items = [1, 2, 3];
      const arr = new ObservableArray(items, console.log);
      arr.applyPatch(patch);
      expect(arr[3]).toBe(10);
    }),
    test("patch:insert", () => {}),
    test("remove an element", async () => {});
  test("modify an element", async () => {});
});
