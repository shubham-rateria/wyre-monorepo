import { ObservableObject } from "./observable-object";
import { TPatch } from "../../types/patch.type";
import { serializeObject } from "../utils/serialize";
import ObservableArray from "../array/observable-array";

const cloneDeep = require("lodash/cloneDeep");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const actors = ["a", "b", "c", "d"];

describe("testing observable objects", () => {
  test("obj:initialize", () => {
    const obj = { arr: [1, 2], text: "some value", counter: 0 };
    const obs = new ObservableObject({
      object: obj,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    expect(obj.text).toBe("some value");
    expect(obj.counter).toBe(0);
  });
  test("obj:set values", () => {
    const obj = { arr: [1, 2], text: "some value", counter: 0 };
    const obs = new ObservableObject({
      object: obj,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    for (let i = 0; i < 5; i++) {
      obs.counter = obs.counter + 1;
    }
    obs["newKey"] = "newValue";
    obs.text = "new text";
    expect(obs.counter).toBe(5);
    expect(obs.newKey).toBe("newValue");
    expect(obs.text).toBe("new text");
  });
  test("obj:onChange", () => {});
  test("obj:timestamp is set", () => {
    const obj = { arr: [1, 2], text: "some value", counter: 0 };
    const obs = new ObservableObject({
      object: obj,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    const rawValue = obs.getRawValue("counter");
    expect(rawValue.timestamp.timestamp.seq).toBe(1);
  });
  test("obj:actorId is set", () => {
    const obj = { arr: [1, 2], text: "some value", counter: 0 };
    const obs = new ObservableObject({
      object: obj,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    const rawValue = obs.getRawValue("counter");
    expect(rawValue.timestamp.timestamp.seq).toBe(1);
  });
  test("obj:timestamp updates on change", () => {
    const obj = { arr: [1, 2], text: "some value", counter: 0 };
    const obs = new ObservableObject({
      object: obj,
      onChange: () => {},
      actorId: actors[0],
      collectionName: "",
      emitPatch: (patch) => {},
    });
    for (let i = 0; i < 5; i++) {
      obs.counter = obs.counter + 1;
      const rawValue = obs.getRawValue("counter");
      expect(rawValue.timestamp.timestamp.seq).toBe(i + 2);
      expect(rawValue.timestamp.timestamp.actorId).toBe(actors[0]);
    }
  });
  test("obj:delete should tombstone value", () => {
    const obj = { arr: [1, 2], text: "some value", counter: 0 };
    const obs = new ObservableObject({
      object: obj,
      onChange: () => {},
      actorId: actors[0],
      collectionName: "",
      emitPatch: (patch) => {},
    });
    obs.delete("text");
    const rawValue = obs.getRawValue("text");
    expect(rawValue.tombstone).toBe(true);
    expect(obs.text).toBeUndefined();
  });
  test("obj:deleted key should not be shown", () => {});
  test("obj:child:arr patch should work", async () => {
    const obj = { obj: { key: [1, 2, { key: "val" }] } };
    const patches: TPatch[] = [];
    const obs = new ObservableObject({
      object: obj,
      onChange: () => {},
      actorId: actors[1],
      collectionName: "",
      emitPatch: (patch) => {
        patches.push(patch);
      },
    });
    obs.obj.key[2].key = "val1";
    await sleep(100);
    const obs1 = new ObservableObject({
      object: obj,
      onChange: () => {},
      actorId: actors[0],
      collectionName: "",
      emitPatch: (patch) => {},
    });
    obs1.applyPatch(patches[0]);
    expect(obs1.obj.key[2].key).toBe("val1");
  });
  test("obj:child:object should be correct type:obj", () => {});
  test("obj:child:object should be correct type:primitive", () => {});
  test("obj:child:object patch should work", async () => {
    const obj = { obj: { key: "val" } };
    const patches: TPatch[] = [];
    const obs = new ObservableObject({
      object: obj,
      onChange: () => {},
      actorId: actors[1],
      collectionName: "",
      emitPatch: (patch) => {
        patches.push(patch);
      },
    });
    obs.obj.key = "val1";
    await sleep(100);
    const obs1 = new ObservableObject({
      object: obj,
      onChange: () => {},
      actorId: actors[0],
      collectionName: "",
      emitPatch: (patch) => {},
    });
    obs1.applyPatch(patches[0]);
    expect(obs1.obj.key).toBe("val1");
  });
  test("obj:patch:add", () => {
    const patch: TPatch = {
      actorId: actors[0],
      seq: 1,
      op: "add",
      path: "/newKey",
      value: "newValue",
    };
    const obj = { arr: [1, 2], text: "some value", counter: 0 };
    const obs = new ObservableObject({
      object: obj,
      onChange: () => {},
      actorId: actors[1],
      collectionName: "",
      emitPatch: (patch) => {},
    });
    obs.applyPatch(patch);
    expect(obs.newKey).toBe(patch.value);
  });
  test("obj:patch:add:timestamp is lesser by seq", () => {
    const patch: TPatch = {
      actorId: actors[0],
      seq: 1,
      op: "add",
      path: "/newKey",
      value: "newValue",
    };
  });
  test("patch:delete", () => {
    const patch: TPatch = {
      actorId: actors[0],
      seq: 2,
      op: "remove",
      path: "/key",
    };
    const obj = { key: "value" };
    const obs = new ObservableObject({
      object: obj,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    obs.applyPatch(patch);
    expect(obs.key).toBeUndefined();
  });
  test("patch:delete:generate", () => {
    const patches: TPatch[] = [];
    const obj = { key: "value" };
    const obs1 = new ObservableObject({
      object: obj,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {
        patches.push(patch);
      },
    });
    obs1.delete("key");
    expect(patches.length).toBe(1);
    expect(patches[0].path).toBe("/key");
  });
});

describe("nested patches", () => {
  test("nested:1:array:change", () => {
    const obj = { key: [1, 2, 3] };
    const obs = new ObservableObject({
      object: obj,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    const patch: TPatch = {
      op: "replace",
      path: "/key/$0",
      actorId: "",
      seq: 2,
      value: 10,
    };
    obs.applyPatch(patch);
    expect(obs.key[0]).toBe(10);
  });
  test("nested:2:array:change", () => {
    const obj = { key: [{ key: [1, 2, 3] }] };
    const obs = new ObservableObject({
      object: obj,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    const patch: TPatch = {
      op: "replace",
      path: "/key/$0/key/$0",
      actorId: "",
      seq: 2,
      value: 10,
    };
    obs.applyPatch(patch);
    expect(obs.key[0].key[0]).toBe(10);
  });
  test("nested:1:object:change", () => {
    const obj = { key: { key: "value" } };
    const obs = new ObservableObject({
      object: obj,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    const patch: TPatch = {
      op: "replace",
      path: "/key/key",
      actorId: "",
      seq: 2,
      value: 10,
    };
    obs.applyPatch(patch);
    expect(obs.key.key).toBe(10);
  });
  test("object:key:insert", () => {
    const patches: any[] = [];
    const obs = new ObservableObject({
      object: {},
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {
        patches.push(patch);
      },
    });
    obs.insert("key", [1, 2, 3]);
    expect(obs.key.length).toBe(3);
    expect(obs.key).toBeInstanceOf(ObservableArray);
    expect(patches.length).toBe(1);
    expect(patches[0].path).toBe("/key");
    expect(patches[0].op).toBe("add");
    console.log(obs.key, typeof obs, obs, typeof obs.key);
  });
  test("object:key:insert:patch", () => {
    const patches: any[] = [];
    const obs = new ObservableObject({
      object: {},
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {
        patches.push(patch);
      },
    });
    obs.insert("key", [1, 2, 3]);
    const obs1 = new ObservableObject({
      object: {},
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    obs1.applyPatch(patches[0]);
    expect(obs1.key.length).toBe(3);
    expect(obs1.key).toBeInstanceOf(ObservableArray);
  });
});

describe("testing situations", () => {
  test("two people change the same object: 1", () => {
    const d = { key: "val" };
    const obs = new ObservableObject({
      object: d,
      onChange: () => {},
      actorId: actors[1],
      collectionName: "",
      emitPatch: (patch) => {},
    });

    /**
     * I make the change
     */
    obs.key = "val1";
    const rawValue = obs.getRawValue("key");
    expect(rawValue.timestamp.timestamp.seq).toBe(2);
    expect(rawValue.timestamp.timestamp.actorId).toBe(actors[1]);

    /**
     * another user makes a change
     */
    const patch: TPatch = {
      actorId: actors[0],
      seq: 2,
      op: "replace",
      path: "/key",
      value: "val2",
    };
    obs.applyPatch(patch);

    /**
     * since (a, 2) < (b, 2), this patch should not be applied
     */
    expect(obs.key).toBe("val1");
  });
  test("two people change the same object: 2", () => {
    const d = { key: "val" };
    const obs = new ObservableObject({
      object: d,
      onChange: () => {},
      actorId: actors[0],
      collectionName: "",
      emitPatch: (patch) => {},
    });

    /**
     * I make the change
     */
    obs.key = "val1";
    const rawValue = obs.getRawValue("key");
    expect(rawValue.timestamp.timestamp.seq).toBe(2);
    expect(rawValue.timestamp.timestamp.actorId).toBe(actors[0]);

    /**
     * another user makes a change
     */
    const patch: TPatch = {
      actorId: actors[1],
      seq: 2,
      op: "replace",
      path: "/key",
      value: "val2",
    };
    obs.applyPatch(patch);

    /**
     * since (b, 2) > (a, 2), this patch should be applied
     */
    expect(obs.key).toBe("val2");
  });

  test("what happens when things arrive out of order", () => {});
});

describe("situation tests", () => {
  test("situation:1", () => {
    const d = {
      value: 0,
      text: "hello\n",
      slider: 20,
      radio: "a",
      inputNumber: 0,
      peopleInRoom: 1,
      timelineItems: [0, 1],
      step: 2,
      formField1: "",
      formField2: "",
    };
    const patches1: any[] = [];
    const obj1 = new ObservableObject({
      object: d,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {
        patches1.push(patch);
      },
    });
    for (let i = 0; i < 5; i++) {
      obj1.inputNumber++;
    }
    expect(patches1.length).toBe(5);
    const obj2 = new ObservableObject({
      object: d,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {},
    });
    for (let i = 0; i < patches1.length; i++) {
      obj2.applyPatch(patches1[i]);
    }
    expect(obj2.inputNumber).toBe(obj1.inputNumber);
    console.log("[situation:1]", obj2.timelineItems);
    expect(obj2.timelineItems.length).toBe(d.timelineItems.length);
    expect(obj2.timelineItems[0]).toBe(d.timelineItems[0]);
  });
  test("situation:2", () => {
    const d = {
      inputNumber: 0,
      timelineItems: [0, 1],
    };
    const patches1: any[] = [];
    const obj1 = new ObservableObject({
      object: d,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {
        patches1.push(patch);
      },
    });
    const samplePatch: TPatch = {
      op: "replace",
      path: "/inputNumber",
      value: 1,
      actorId: "a",
      seq: 2,
    };
    const serializedObject = serializeObject(obj1);
    obj1.applyPatch(samplePatch);
    expect(obj1.timelineItems[0]).toBe(0);
  });
  test("situation:3", () => {
    const d = {
      inputNumber: 0,
      timelineItems: [0, 1],
    };
    const patches1: any[] = [];
    const obj1 = new ObservableObject({
      object: d,
      onChange: () => {},
      actorId: "a",
      collectionName: "",
      emitPatch: (patch) => {
        patches1.push(patch);
      },
    });
    console.log(cloneDeep(obj1));
  });
});

describe("multi user sync test", () => {
  test("sync:multi:user", async () => {});
});
