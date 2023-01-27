// import { Sync } from "reactive";

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
    () => {
      console.log("changed");
    }
  );
}

setup();
