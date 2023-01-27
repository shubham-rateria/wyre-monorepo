async function setup() {
  const { Sync } = await import("reactive");

  const obj = {
    refid: "some-random-refid-3",
    d: 1,
    arr: [1, 2, 4],
    obj: { a: { a: 1 } },
  };

  const sync = Sync(
    obj,
    "http://api.wyre.live:3002",
    { path: "/socket.io" },
    () => {}
  );

  sync.d = 2;
  sync.arr[2] = 10;
  // sync.arr.push(11);
  // sync.obj.a.a = 10;

  const patch = { op: "replace", path: "/d", value: 10 };

  sync.obj.applyPatch(patch);
}

setup();
