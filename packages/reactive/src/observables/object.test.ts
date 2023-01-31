import ObservableObject from "./observable-object";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("testing observable objects", () => {
  // test("patches are being generated", async () => {
  //   const patches: any[] = [];
  //   function addPatch(patch) {
  //     patches.push(patch);
  //   }
  //   const obj = {
  //     d: 1,
  //     arr: [1],
  //   };
  //   const obs = new ObservableObject(obj, addPatch);

  //   obs.d = 1;
  //   obs.arr.push(2);

  //   await sleep(1000);

  //   expect(patches.length).toBe(2);
  // });

  test("all basic operations should work", async () => {
    const obj = { arr: [1, 2], text: "some value", counter: 0 };
    const obs = new ObservableObject(obj, (patch: any) => {});

    for (let i = 0; i < 5; i++) {
      obs.counter = obs.counter + 1;
    }

    expect(obs.counter).toBe(5);
  });

  test("apply patch works", async () => {
    const obj = { arr: [1, 2] };
    const patch = { op: "replace", path: "/arr/0", value: 10 };

    const obs = new ObservableObject(obj, (patch: any) => {});

    obs.applyPatch(patch);

    expect(obs.arr[0]).toBe(10);
  });

  // test("apply patch does not trigger callbacks / remove events", async () => {
  //   const obj = { arr: [1, 2] };
  //   const patch = { op: "add", path: "/arr/2", value: 10 };

  //   const patches: any[] = [];
  //   function addPatch(patch: any) {
  //     patches.push(patch);
  //   }

  //   const obs = new ObservableObject(obj, addPatch);

  //   obs.applyPatch(patch);

  //   await sleep(10);

  //   expect(patches.length).toBe(0);
  //   expect(obs.arr.length).toBeDefined();
  //   expect(obs.arr.length).toBe(3);
  // });
});
