const { createWyre } = require("@wyre-client/core");
const { Worker } = require("worker_threads");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startStreamer() {
  const sync = createWyre({
    data: { todos: [] },
  });
  const data = await sync.init("syncKey1");
  const data2 = await sync.init("syncKey2");
  const data3 = await sync.init("syncKey3");
  for (let i = 0; i < 20; i++) {
    data.todos.push(i);
    console.log("[streaming]", i);
    await sleep(1000);
    if (i > 5) {
      await sleep(10000);
    }
  }
}

startStreamer();
