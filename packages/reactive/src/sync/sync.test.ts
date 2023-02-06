import { Sync } from "./index";

const obj = { refid: "some-new-channel-20", d: 1 };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("test end to end sync", () => {
  test("go crazy", async () => {
    const clients: any[] = [];

    const NUM_CLIENTS = 20;
    const NUM_CHANGES = 10;

    // create 10 clients and change random values
    for (let i = 0; i < NUM_CLIENTS; i++) {
      const client = Sync(obj, () => {}, i.toString());
      clients.push(client);
    }

    // wait for everyone to be added to the room
    await sleep(5000);

    // // make a 100(?) changes
    for (let i = 0; i < Math.min(NUM_CHANGES, NUM_CLIENTS); i++) {
      const client = clients[i];
      client.data.d = Math.random();
    }

    for (let i = 0; i < Math.min(NUM_CHANGES, NUM_CLIENTS); i++) {
      const client = clients[i];
      client.data.d = Math.random();
    }

    await sleep(10000);

    const values: any[] = clients.map((client) => client.data.d);

    console.log("[values]", values);

    const valToCheck = values[0];

    for (const value of values) {
      expect(value).toBe(valToCheck);
    }
  });

  // test("reject patches with same lamport stamps", async () => {
  //   const sync1 = Sync(obj, () => {});
  //   const sync2 = Sync(obj, () => {});

  //   // console.log("[socketid:sync1]: ", sync1.io.id);
  //   // console.log("[socketid:sync2]: ", sync2.io.id);

  //   await sleep(2000);

  //   let testPassed = false;

  //   sync1.data.d = 10;
  //   sync2.data.d = 0;

  //   await sleep(5000);

  //   console.log("[syncres]", sync1.data.d, sync2.data.d);
  //   if (sync1.data.d === sync2.data.d) {
  //     testPassed = true;
  //   }

  //   expect(testPassed).toBe(true);

  //   testPassed = false;

  //   sync2.data.d = 0;
  //   sync1.data.d = 10;

  //   await sleep(5000);

  //   console.log("[syncres]", sync1.data.d, sync2.data.d);
  //   expect(sync1.data.d).toBe(sync2.data.d);
  // });

  // test("latency", async () => {
  //   const { data } = Sync(obj, () => {});
  //   Sync(obj, () => {
  //     receiveData();
  //   });

  //   let t1: number;
  //   let t2: number;
  //   let diff: number;

  //   function send() {
  //     t1 = Date.now();
  //     data.d = 1;
  //   }

  //   function receiveData() {
  //     diff = Date.now() - t1;
  //     console.log("diff", diff);
  //     expect(diff).toBeLessThan(1000);
  //   }

  //   // await sleep(2000);

  //   send();

  //   await sleep(5000);
  // });
});
