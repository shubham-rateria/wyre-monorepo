import ObservableObject from "./observable-object";
import { TPatch } from "../../types/patch.type";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const actors = ["a", "b", "c", "d"];

describe("testing observable objects", () => {
  test("obj:initialize", () => {
    const obj = { arr: [1, 2], text: "some value", counter: 0 };
    const obs = new ObservableObject(obj, (patch: any) => {});
    expect(obj.text).toBe("some value");
    expect(obj.counter).toBe(0);
  });
  test("obj:set values", () => {
    const obj = { arr: [1, 2], text: "some value", counter: 0 };
    const obs = new ObservableObject(obj, (patch: any) => {});
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
    const obs = new ObservableObject(obj, (patch: any) => {});
    const rawValue = obs.getRawValue("counter");
    expect(rawValue.timestamp.timestamp.seq).toBe(1);
  });
  test("obj:actorId is set", () => {
    const obj = { arr: [1, 2], text: "some value", counter: 0 };
    const obs = new ObservableObject(obj, (patch: any) => {});
    const rawValue = obs.getRawValue("counter");
    expect(rawValue.timestamp.timestamp.seq).toBe(1);
  });
  test("obj:timestamp updates on change", () => {
    const obj = { arr: [1, 2], text: "some value", counter: 0 };
    const obs = new ObservableObject(obj, (patch: any) => {}, actors[0]);
    for (let i = 0; i < 5; i++) {
      obs.counter = obs.counter + 1;
      const rawValue = obs.getRawValue("counter");
      expect(rawValue.timestamp.timestamp.seq).toBe(i + 2);
      expect(rawValue.timestamp.timestamp.actorId).toBe(actors[0]);
    }
  });
  test("obj:delete should tombstone value", () => {
    const obj = { arr: [1, 2], text: "some value", counter: 0 };
    const obs = new ObservableObject(obj, (patch: any) => {}, actors[0]);
    obs.delete("text");
    const rawValue = obs.getRawValue("text");
    expect(rawValue.tombstone).toBe(true);
    expect(obs.text).toBeUndefined();
  });
  test("obj:deleted key should not be shown", () => {});
  test("obj:child:arr patch should work", async () => {
    const obj = { obj: { key: [1, 2, { key: "val" }] } };
    const patches: TPatch[] = [];
    const obs = new ObservableObject(
      obj,
      (patch: any) => {
        console.log("[nested child]", patch);
        patches.push(patch);
      },
      actors[1]
    );
    obs.obj.key[2].key = "val1";
    await sleep(100);
    const obs1 = new ObservableObject(obj, () => {}, actors[0]);
    obs1.applyPatch(patches[0]);
    expect(obs1.obj.key[2].key).toBe("val1");
  });
  test("obj:child:object should be correct type:obj", () => {});
  test("obj:child:object should be correct type:primitive", () => {});
  test("obj:child:object patch should work", async () => {
    const obj = { obj: { key: "val" } };
    const patches: TPatch[] = [];
    const obs = new ObservableObject(
      obj,
      (patch: any) => {
        console.log("[nested child]", patch);
        patches.push(patch);
      },
      actors[1]
    );
    obs.obj.key = "val1";
    await sleep(100);
    const obs1 = new ObservableObject(obj, () => {}, actors[0]);
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
    const obs = new ObservableObject(obj, (patch: any) => {}, actors[1]);
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
    const obs = new ObservableObject(obj, () => {});
    obs.applyPatch(patch);
    expect(obs.key).toBeUndefined();
  });
  test("patch:delete:generate", () => {
    const patches: TPatch[] = [];
    const obj = { key: "value" };
    const obs1 = new ObservableObject(obj, (patch: TPatch) => {
      patches.push(patch);
    });
    obs1.delete("key");
    expect(patches.length).toBe(1);
    expect(patches[0].path).toBe("/key");
  });
});

describe("nested patches", () => {
  test("nested:1:array:change", () => {
    const obj = { key: [1, 2, 3] };
    const obs = new ObservableObject(obj, () => {});
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
    const obs = new ObservableObject(obj, () => {});
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
    const obs = new ObservableObject(obj, () => {});
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
});

describe("testing situations", () => {
  test("two people change the same object: 1", () => {
    const d = { key: "val" };
    const obs = new ObservableObject(d, () => {}, actors[1]);

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
    const obs = new ObservableObject(d, () => {}, actors[0]);

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

describe("multi user sync test", () => {
  test("sync:multi:user", async () => {});
});
