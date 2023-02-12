import { ObservableObject } from "../observables/object/observable-object";
import { Sync } from "./index";
import { _SyncManager } from "./sync";

const obj = { refid: "some-new-channel-20", d: 1 };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("test end to end sync", () => {
  // test("go crazy", async () => {
  //   const clients: any[] = [];
  //   const NUM_CLIENTS = 20;
  //   const NUM_CHANGES = 10;
  //   // create 10 clients and change random values
  //   for (let i = 0; i < NUM_CLIENTS; i++) {
  //     const client = Sync(obj, () => {}, i.toString());
  //     clients.push(client);
  //   }
  //   // wait for everyone to be added to the room
  //   await sleep(5000);
  //   // // make a 100(?) changes
  //   for (let i = 0; i < Math.min(NUM_CHANGES, NUM_CLIENTS); i++) {
  //     const client = clients[i];
  //     client.data.d = Math.random();
  //   }
  //   for (let i = 0; i < Math.min(NUM_CHANGES, NUM_CLIENTS); i++) {
  //     const client = clients[i];
  //     client.data.d = Math.random();
  //   }
  //   await sleep(10000);
  //   const values: any[] = clients.map((client) => client.data.d);
  //   console.log("[values]", values);
  //   const valToCheck = values[0];
  //   for (const value of values) {
  //     expect(value).toBe(valToCheck);
  //   }
  // });
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

// describe("testing initial sync", () => {
//   test("sync:initial:3 clients", async () => {
//     const data = { counter: 1, refid: "a-random-refid-105" };
//     const obs1 = Sync(data, () => {}, "a");
//     const obs2 = Sync(data, () => {}, "b");

//     await sleep(10000);

//     obs1.data.counter++;
//     await sleep(100);
//     obs2.data.counter++;

//     await sleep(1000);

//     const obs3 = Sync(data, () => {}, "c");
//     await obs3.sync();

//     await sleep(5000);

//     expect(obs2.data.counter).toBe(obs1.data.counter);
//     expect(obs3.data.counter).toBe(obs1.data.counter);
//   });
// });

describe("test sync manager", () => {
  // test("todo:scenario:1", async () => {
  //   const sync1 = new _SyncManager();
  //   // const sync2 = new _SyncManager();
  //   const sync3 = new _SyncManager();

  //   await sync1.init();
  //   // await sync2.init();
  //   await sync3.init();

  //   const data = {
  //     todos: [],
  //   };

  //   const refid = "a-random-refid:1";

  //   const data1 = await sync1.create({
  //     data,
  //     collectionName: "TestCollection",
  //     refid,
  //     onChange() {},
  //   });

  //   // @ts-ignore
  //   data1.todos.push({
  //     text: "A New Todo",
  //     done: false,
  //   });
  // });
  test("1", async () => {
    const sync1 = new _SyncManager();
    // const sync2 = new _SyncManager();
    const sync3 = new _SyncManager();
    await sync1.init();
    // await sync2.init();
    await sync3.init();

    const data = {
      todos: [{ text: "some text", done: false }],
      counter: 1,
      refid: "some-refid-here-04",
    };

    const data1 = await sync1.create({
      data,
      collectionName: "TestCollection",
      refid: data.refid,
      onChange() {},
    });
    const data3 = await sync3.create({
      data,
      collectionName: "TestCollection",
      refid: data.refid,
      onChange() {},
    });

    // @ts-ignore
    data1.counter = 10;
    // @ts-ignore
    // data2.counter++;

    await sleep(2000);
    // @ts-ignore
    expect(data3.counter).toBe(data1.counter);
  });
});
