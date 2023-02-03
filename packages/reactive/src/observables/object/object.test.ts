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
  test("obj:delete should tombstone value", () => {});
  test("obj:deleted key should not be shown", () => {});
  test("obj:child object should be correct type:arr", () => {});
  test("obj:child object should be correct type:obj", () => {});
  test("obj:child object should be correct type:primitive", () => {});
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
     * since (a, 2) < (b, 2), this patch should be applied
     */
    expect(obs.key).toBe("val2");
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
     * since (b, 2) not < (a, 2), this patch should not be applied
     */
    expect(obs.key).toBe("val1");
  });
});
