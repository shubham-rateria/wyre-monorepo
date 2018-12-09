const { createWyre } = require("@wyre-client/core");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startStreamer() {
  const sync = createWyre({
    data: { todos: [] },
    onChange: () => {
      console.log("received data");
    },
  });
  const data = await sync.init("streamer:testing:2");
  console.log("initial data", data.toJSON());
  // for (let i = 0; i < 1000; i++) {
  //   data.todos.push(i);
  //   console.log("[streaming]", i);
  //   await sleep(2000);
  // }
}

startStreamer();
