import { ObservableObject } from "../object/observable-object";
import ObservableArray, { ArrayValue } from "./observable-array";
import { TPatch } from "../../types/patch.type";
import { Key } from "./key/key";
import { getTokens } from "./patch/patch";
import { serializeArray, serializeObject } from "../utils/serialize";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("tests for array", () => {
  test("create an array", async () => {
    const items = [1, 2, 3];
    const arr = new ObservableArray({
      items,
      onChange: () => {},
      actorId: "",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    expect(arr.length).toBe(items.length);
  });
  test("basic set", () => {
    const items = [1, 2, 3];
    const arr = new ObservableArray({
      items,
      onChange: () => {},
      actorId: "",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    arr[0] = 10;
    expect(arr[0]).toBe(10);
  }),
    test("array:push:new", async () => {
      const arr = new ObservableArray({
        items: [],
        onChange: () => {},
        actorId: "",
        collectionName: "",
        emitPatch: (patch) => {},
      });
      arr.push(10);
      expect(arr[0]).toBe(10);
      expect(arr.length).toBe(1);
    });
  test("array:push:existing", async () => {
    const items = [1, 2, 3];
    const arr = new ObservableArray({
      items,
      onChange: () => {},
      actorId: "",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    arr.push(10);
    expect(arr[3]).toBe(10);
    expect(arr.length).toBe(items.length + 1);
  });
  test("array:push:multiple", async () => {
    const items = [1, 2, 3];
    const arr = new ObservableArray({
      items,
      onChange: () => {},
      actorId: "",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    const toAdd = 5;
    for (let i = 0; i < toAdd; i++) {
      arr.push(i);
      expect(arr[items.length + i]).toBe(i);
    }
    expect(arr.length).toBe(items.length + toAdd);
  });
  test("array:map", () => {
    const items = [1, 2, 3];
    const arr = new ObservableArray({
      items,
      onChange: () => {},
      actorId: "",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    let counter = 0;
    arr.map((val) => {
      console.log("map", val);
      expect(val).toBe(items[counter]);
      counter++;
    });
  }),
    test("array:push:weirdbug", () => {
      const pushitems = [1, 2, 3, 4];
      const arr = new ObservableArray({
        items: [],
        onChange: () => {},
        actorId: "",
        collectionName: "",
        emitPatch: (patch) => {},
      });
      let counter = 0;
      for (let i = 0; i < pushitems.length; i++) {
        arr.push(pushitems[i]);
      }
      for (let i = 0; i < arr.length; i++) {
        expect(arr[i]).toBe(pushitems[i]);
      }
    }),
    test("array:push:howmuch", () => {
      const arr = new ObservableArray({
        items: [],
        onChange: () => {},
        actorId: "",
        collectionName: "",
        emitPatch: (patch) => {},
      });
      for (let i = 0; i < 40; i++) {
        arr.push(i);
      }
    }),
    test("child:arr", () => {
      const items = [
        [1, 2, 3],
        [4, 5, 6],
      ];
      const arr = new ObservableArray({
        items,
        onChange: () => {},
        actorId: "",
        collectionName: "",
        emitPatch: (patch) => {},
      });
      expect(arr[0]).toBeInstanceOf(ObservableArray);
    });
  test("child:object", () => {
    const items = [{ d: 1 }];
    const arr = new ObservableArray({
      items,
      onChange: () => {},
      actorId: "",
      collectionName: "",
      emitPatch: (patch) => {},
    });
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
    const arr = new ObservableArray({
      items,
      onChange: () => {},
      actorId: "",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    arr.applyPatch(patch);
    expect(arr[0]).toBe(10);
  }),
    test("patch:path for push", async () => {
      const items = [1, 2, 3];
      const patches: TPatch[] = [];
      const obs1 = new ObservableArray({
        items,
        onChange: () => {},
        actorId: "a",
        collectionName: "",
        emitPatch: (patch) => {
          patches.push(patch);
        },
      });
      obs1.push(10);
      await sleep(200);
      expect(patches.length).toBe(1);
      // expect(patches[0].path).toBe("/$0.95");
      expect(patches[0].value).toBe(10);
      expect(patches[0].actorId).toBe("a");
    }),
    test("array: both crdt and normal index works", async () => {
      const items = [1, 2, 3];
      const obs1 = new ObservableArray({
        items,
        onChange: () => {},
        actorId: "",
        collectionName: "",
        emitPatch: (patch) => {},
      });
      expect(obs1["$0"]).toBe(1);
      expect(obs1[0]).toBe(1);
    });
  test("modify an element", async () => {});
  test("arr:delete", () => {
    const items = [1, 2, 3];
    const patches: any[] = [];
    const obs1 = new ObservableArray({
      items,
      onChange: () => {},
      actorId: "",
      collectionName: "",
      emitPatch: (patch) => {
        patches.push(patch);
      },
    });
    obs1.delete(0);
    const rawValue = obs1.getRawValue(0);
    expect(obs1[0]).toBe(items[1]);
    // expect(rawValue.tombstone).toBe(true);
    // expect(obs1[0]).toBe(items[1]);
    // expect(patches.length).toBe(1);
    // expect(patches[0].path).toBe("/$0");
    // expect(patches[0].op).toBe("remove");
  });
  test("arr:delete:2", () => {
    const items = [
      { name: "text", done: false, id: 0 },
      { name: "text", done: false, id: 1 },
      { name: "text", done: false, id: 2 },
    ];
    const d = {
      todos: items,
    };
    const obj = new ObservableObject({
      object: d,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    obj.todos.delete(1);
    const values = obj.todos.map((val) => val.id);
    console.log("[values]", values);
    expect(values.length).toBe(2);
  });
  test("arr:delete:multiple", () => {
    const items = [
      { name: "text", done: false, id: 0 },
      { name: "text", done: false, id: 1 },
      { name: "text", done: false, id: 2 },
      { name: "text", done: false, id: 3 },
      { name: "text", done: false, id: 4 },
      { name: "text", done: false, id: 5 },
    ];
    const d = {
      todos: items,
    };
    const obj = new ObservableObject({
      object: d,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    const NUM_VALUES_TO_DELETE = 3;
    for (let i = 0; i < NUM_VALUES_TO_DELETE; i++) {
      obj.todos.delete(1);
    }
    const values = obj.todos.map((val) => val.id);
    console.log("[values]", values);
    expect(values.length).toBe(items.length - NUM_VALUES_TO_DELETE);
    expect(obj.todos[1].id).toBe(4);
  });
  test("arr:delete:patch", () => {
    const items = [1, 2, 3];
    const patch: TPatch = {
      op: "remove",
      actorId: "",
      seq: 2,
      path: "/$0",
    };
    const patches: any[] = [];
    const arr = new ObservableArray({
      items,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {
        patches.push(patch);
      },
    });
    arr.applyPatch(patch);
    // const rawValue: ArrayValue = arr.getRawValue(0);
    // expect(rawValue.tombstone).toBe(true);
    expect(patches.length).toBe(0);
    expect(arr[0]).toBe(items[1]);
  });
  test("arr:delete:kicker", async () => {
    /**
     * when one client deletes an element,
     * that index cannot be updated.
     * This means that if patch with add, remove
     * or delete op is received on a key
     * that has been deleted, that patch will be ignored
     */
    const items = [1, 2, 3];
    const patches1: any[] = [];
    const client1 = new ObservableArray({
      items,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {
        patches1.push(patch);
      },
    });
    client1.delete(0);
    expect(patches1.length).toBe(1);
    const replacePatch: TPatch = {
      actorId: "",
      op: "replace",
      path: "/$0",
      seq: 2,
    };
    client1.applyPatch(replacePatch);
  });
  test("patch:nested:object", () => {
    const data = {
      todos: [{ text: "some text", done: false }],
    };
    const patch: TPatch = {
      actorId: "",
      seq: 2,
      op: "replace",
      path: "/todos/$0/done",
      value: true,
    };
    const obs = new ObservableObject({
      object: data,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    obs.applyPatch(patch);
    expect(obs.todos[0].done).toBe(true);
  });
  // test("arr:findindextoinsert", () => {
  //   const arr = new ObservableArray({
  //     items: [1, 2, 3, 4, 5, 6],
  //     onChange: () => {},
  //     actorId: "a",
  //     collectionName: "",
  //     emitPatch: (patch) => {},
  //   });
  //   const index = arr.findIndexToInsert("$10");
  //   expect(index).toBe(1);
  // });
});

describe("raw values test", () => {
  let rawValues: any;
  test("rawvalues:get", () => {
    const items = [1, 2, 3, { data: "value", arr: [1, 2, 3] }, [1, 2, 3]];
    const arr = new ObservableArray({
      items,
      onChange: () => {},
      actorId: "",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    rawValues = serializeArray(arr);
    // console.log("rawValues", JSON.stringify(rawValues, null, 4));
    expect(rawValues.length).toBe(items.length);
  });
  test("rawvalues:set", () => {
    const arr = new ObservableArray({
      items: [],
      onChange: () => {},
      actorId: "",
      collectionName: "",
      emitPatch: (patch) => {},
    });
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

describe("situational tests", () => {
  test("situation:1", async () => {
    const items = [1, 2, 3];
    const patches: TPatch[] = [];
    const obs1 = new ObservableArray({
      items,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {
        patches.push(patch);
      },
    });
    const obs2 = new ObservableArray({
      items,
      onChange: () => {},
      actorId: "",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    obs1[0] = 10;
    await sleep(100);
    expect(patches.length).toBe(1);
    expect(patches[0].value).toBe(10);
    // const tokens = getTokens(patches[0].path);
    // expect(Key.isCrdtKey(tokens[1])).toBe(true);
    obs2.applyPatch(patches[0]);
    expect(obs2[0]).toBe(10);
  });
  test("situation:2", async () => {
    const items = [1, 2, 3];
    const patches: any[] = [];
    const obs1 = new ObservableArray({
      items,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {
        patches.push(patch);
      },
    });
    const obs2 = new ObservableArray({
      items,
      onChange: () => {},
      actorId: "b",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    obs1.push(10);
    await sleep(50);
    expect(patches.length).toBe(1);
    console.log("patches", patches);
    obs2.applyPatch(patches[0]);
    expect(obs2.length).toBe(4);
    console.log(obs2.toJSON());
    expect(obs2[3]).toBe(10);
  });
  test("situation:3", () => {
    const arr1 = new ObservableArray({
      items: [],
      onChange: () => {},
      actorId: "",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    const items = [1, 2, 3];
    items.forEach((item) => arr1.push(item));
    const serializedArray = serializeArray(arr1);
    const arr2 = new ObservableArray({
      items: [],
      onChange: () => {},
      actorId: "",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    arr2.setRawValues(serializedArray);
    expect(arr2.length).toBe(items.length);
    for (let i = 0; i < items.length; i++) {
      expect(arr2[i]).toBe(items[i]);
    }
  });
  test("situation:4", () => {
    const items = [
      { id: 0, text: "", done: false },
      { id: 1, text: "", done: false },
      { id: 2, text: "", done: false },
      { id: 3, text: "", done: false },
    ];
    const d = { todos: items };
    const obj1 = new ObservableObject({
      object: d,
      onChange: () => {},
      actorId: "",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    const additionalItems = [
      { id: 4, text: "", done: false },
      { id: 5, text: "", done: false },
      { id: 6, text: "", done: false },
    ];
    for (let i = 0; i < additionalItems.length; i++) {
      obj1.todos.push(additionalItems[i]);
    }
    expect(obj1.todos.length).toBe(items.length + additionalItems.length);
    for (let i = 0; i < obj1.todos.length - 1; i++) {
      expect(obj1.todos[i].id).toBeLessThan(obj1.todos[i + 1].id);
    }
  });
  test("situation:5", () => {
    const items = [
      { id: 0, text: "", done: false },
      { id: 1, text: "", done: false },
      { id: 2, text: "", done: false },
      { id: 3, text: "", done: false },
    ];
    const d = { todos: items };
    const obj1 = new ObservableObject({
      object: d,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    const additionalItems = [
      { id: 4, text: "", done: false },
      { id: 5, text: "", done: false },
      { id: 6, text: "", done: false },
    ];
    for (let i = 0; i < additionalItems.length; i++) {
      obj1.todos.push(additionalItems[i]);
    }
    expect(obj1.todos.length).toBe(items.length + additionalItems.length);
    for (let i = 0; i < obj1.todos.length - 1; i++) {
      expect(obj1.todos[i].id).toBeLessThan(obj1.todos[i + 1].id);
    }

    const serializedObject = serializeObject(obj1);
    const obj2 = new ObservableObject({
      object: d,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    obj2.setRawValues(serializedObject);
    expect(obj2.todos.length).toBe(items.length + additionalItems.length);
    for (let i = 0; i < obj2.todos.length - 1; i++) {
      expect(obj2.todos[i].id).toBeLessThan(obj2.todos[i + 1].id);
    }
  });
  test("situation:7", () => {
    /**
     * array values added from patch should be observable
     */
    const obj1 = new ObservableObject({
      object: { todos: [] },
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    const addPatch = {
      op: "add",
      path: "/todos/$0",
      value: { text: "some-text", value: 1 },
      actorId: "",
      seq: 2,
    };
    obj1.applyPatch(addPatch);
    obj1.todos[0].value = 2;
  }),
    test("situation:6", () => {
      /**
       * When a number of todos are added and then deleted,
       * then some todos are modified, the evaluate function
       * is unable to map the correct todo path and thus
       * the parent comes out to be undefined and patches are
       * not applied.
       */
      const items = [
        { id: 0, text: "", done: false },
        { id: 1, text: "", done: false },
        { id: 2, text: "", done: false },
        { id: 3, text: "", done: false },
        { id: 4, text: "", done: false },
        { id: 5, text: "", done: false },
        { id: 6, text: "", done: false },
        { id: 7, text: "", done: false },
      ];
      const d = { todos: items };
      const obj1 = new ObservableObject({
        object: d,
        onChange: () => {},
        actorId: "a",
        collectionName: "",
        emitPatch: (patch) => {},
      });

      /**
       * if I change a specific todo value,
       * what is the patch that gets generated?
       */
      const todo = obj1.todos[3];
      todo.done = true;

      /**
       * delete a few values then test again
       */
      obj1.todos.delete(1);
      obj1.todos.delete(1);
      obj1.todos.delete(1);
      obj1.todos.delete(1);

      const todo1 = obj1.todos[2];
      todo1.done = true;
    });
});

describe("what happens when patches arrive out of order", () => {
  test("array:add:unordered", () => {
    const arr = new ObservableArray({
      items: [],
      onChange: () => {},
      actorId: "",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    const patch1: TPatch = {
      op: "add",
      path: "/$10",
      value: 2,
      actorId: "a",
      seq: 1,
    };
    const patch2: TPatch = {
      op: "add",
      path: "/$0",
      value: 1,
      actorId: "a",
      seq: 1,
    };
    const patch3: TPatch = {
      op: "add",
      path: "/$30",
      value: 4,
      actorId: "a",
      seq: 1,
    };
    const patch4: TPatch = {
      op: "add",
      path: "/$20",
      value: 3,
      actorId: "a",
      seq: 1,
    };
    arr.applyPatch(patch1);
    arr.applyPatch(patch2);
    arr.applyPatch(patch3);
    arr.applyPatch(patch4);
    console.log("[arr:value]", arr.toJSON());
    expect(arr[0]).toBe(1);
    expect(arr[1]).toBe(2);
    expect(arr[2]).toBe(3);
    expect(arr[3]).toBe(4);
  });
});

describe("what happens when multiple users add at the same index", () => {
  test("multiple:add:index:same", () => {
    const actorIds = ["D-ka0x7yAZZjWIFRAAAd", "NbXy7NXX0ygN7YqRAAAT"];
    const actors: any[] = [];
    for (const id of actorIds) {
      const arr = new ObservableObject({
        object: { todos: [] },
        onChange: (patch) => {},
        actorId: id,
        collectionName: "",
        emitPatch: (patch) => {
          console.log(patch);
        },
      });
      actors.push(arr);
    }
    actors[0].todos.push({ text: "1" });
    const patch0: TPatch = {
      op: "add",
      path: "/todos/$0",
      value: { text: "1" },
      actorId: actorIds[0],
      seq: 1,
    };
    actors[1].todos.push({ text: "2" });
    const patch1: TPatch = {
      op: "add",
      path: "/todos/$0",
      value: { text: "2" },
      actorId: actorIds[1],
      seq: 1,
    };
    actors[0].applyPatch(patch1);
    actors[1].applyPatch(patch0);
    console.log("actors[0]", actors[0].toJSON());
    console.log("actors[1]", actors[1].toJSON());
    actors[0].todos.push({ text: "3" });
    const patch2: TPatch = {
      op: "add",
      path: "/todos/$10",
      value: { text: "3" },
      actorId: actorIds[0],
      seq: 1,
    };
    actors[1].todos.push({ text: "4" });
    const patch3: TPatch = {
      op: "add",
      path: "/todos/$10",
      value: { text: "4" },
      actorId: actorIds[1],
      seq: 1,
    };
    actors[0].applyPatch(patch3);
    actors[1].applyPatch(patch2);
    console.log("actors[0]", actors[0].toJSON());
    console.log("actors[1]", actors[1].toJSON());
    // expect(actors[0][0]).toBe(actors[1][0]);
    // expect(actors[0][1]).toBe(actors[1][1]);
  });
});
