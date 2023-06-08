const { createWyre } = require("@wyre-client/core");
const { Worker } = require("worker_threads");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startStreamer() {
  const sync = createWyre({
    data: { todos: [] },
  });
  const data = await sync.init("streamer:testing:2");
  await sleep(5000);
  for (let i = 0; i < 200; i++) {
    data.todos.push(i);
    console.log("[streaming]", i);
    await sleep(1000);
  }
}

startStreamer();
