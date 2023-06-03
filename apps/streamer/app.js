const { createWyre } = require("@wyre-client/core");
const { Worker } = require("worker_threads");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startStreamer() {
  const sync = createWyre({
    data: { todos: [] },
  });
  const data = await sync.init("streamer:testing:2");
  for (let i = 0; i < 20; i++) {
    data.todos.push(i);
    console.log("[streaming]", i);
    await sleep(2000);
  }
}

startStreamer();
