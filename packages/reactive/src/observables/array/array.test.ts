import { ObservableObject } from "../object/observable-object";
import ObservableArray from "./observable-array";
import { TPatch } from "../../types/patch.type";
import { Key } from "./key/key";
import { getTokens } from "./patch/patch";
import { serializeArray } from "../utils/serialize";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("tests for array", () => {
  test("create an array", async () => {
    const items = [1, 2, 3];
    const arr = new ObservableArray(items, () => {});
    expect(arr.length).toBe(items.length);
  });
  test("basic set", () => {
    const arr = new ObservableArray([1, 2, 3], () => {});
    arr[0] = 10;
    expect(arr[0]).toBe(10);
  }),
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
    const patch: TPatch = {
      op: "replace",
      path: "/$0",
      value: 10,
      seq: 1,
      actorId: "a",
    };
    const items = [1, 2, 3];
    const arr = new ObservableArray(items, console.log, "b");
    arr.applyPatch(patch);
    expect(arr[0]).toBe(10);
  }),
    test("patch:path for push", async () => {
      const items = [1, 2, 3];
      const patches: TPatch[] = [];
      const obs1 = new ObservableArray(
        items,
        (patch) => {
          patches.push(patch);
          console.log("[patch:new]", patch);
        },
        "a"
      );
      obs1.push(10);
      await sleep(200);
      expect(patches.length).toBe(1);
      // expect(patches[0].path).toBe("/$0.95");
      expect(patches[0].value).toBe(10);
      expect(patches[0].actorId).toBe("a");
    }),
    test("patch:one client changes value in the array and patch is sent to others", async () => {
      const items = [1, 2, 3];
      const patches: TPatch[] = [];
      const obs1 = new ObservableArray(items, (patch) => {
        patches.push(patch);
        console.log("[patch:change]", patch);
      });
      const obs2 = new ObservableArray(items, () => {});
      obs1[0] = 10;
      await sleep(100);
      expect(patches.length).toBe(1);
      expect(patches[0].value).toBe(10);
      // const tokens = getTokens(patches[0].path);
      // expect(Key.isCrdtKey(tokens[1])).toBe(true);
      obs2.applyPatch(patches[0]);
      expect(obs2[0]).toBe(10);
    }),
    test("patch:client:push", async () => {
      const items = [1, 2, 3];
      const patches: any[] = [];
      const obs1 = new ObservableArray(items, (patch) => {
        patches.push(patch);
        console.log("[patch:new]", patch);
      });
      const obs2 = new ObservableArray(items, () => {});
      obs1.push(10);
      await sleep(50);
      expect(patches.length).toBe(1);
      obs2.applyPatch(patches[0]);
      expect(obs2.length).toBe(4);
      expect(obs2[3]).toBe(10);
    }),
    test("array: both crdt and normal index works", async () => {
      const items = [1, 2, 3];
      const obs1 = new ObservableArray(items, (patch) => {});
      expect(obs1["$0"]).toBe(1);
      expect(obs1[0]).toBe(1);
    });
  test("modify an element", async () => {});
});

describe("raw values test", () => {
  let rawValues: any;
  test("rawvalues:get", () => {
    const items = [1, 2, 3, { data: "value", arr: [1, 2, 3] }, [1, 2, 3]];
    const arr = new ObservableArray(items, () => {});
    rawValues = serializeArray(arr);
    // console.log("rawValues", JSON.stringify(rawValues, null, 4));
    expect(rawValues.length).toBe(items.length);
  });
  test("rawvalues:set", () => {
    const arr = new ObservableArray([], () => {});
    arr.setRawValues(rawValues);
    console.log("arr", arr, arr[3], arr[3].arr, arr[3].data);
    expect(arr[0]).toBe(1);
    expect(arr[1]).toBe(2);
    expect(arr[2]).toBe(3);
    expect(arr[3].data).toBe("value");
    expect(arr[4].length).toBe(3);
    expect(arr[4][0]).toBe(1);
    expect(arr[4][1]).toBe(2);
    expect(arr[4][2]).toBe(3);
    expect(arr[3].arr.length).toBe(3);
    expect(arr[3].arr[0]).toBe(1);
    expect(arr[3].arr[1]).toBe(2);
    expect(arr[3].arr[2]).toBe(3);
  });
});
