import ObservableArray from "../array/observable-array";
describe("json conversion test", () => {
  test("array", () => {
    const arr = new ObservableArray(
      [1, 2, 34, { key: "value", arr: [1, 2, 3] }],
      () => {}
    );
    console.log(arr.toJSON());
  });
});
