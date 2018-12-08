const { io } = require("socket.io-client");
const { createWyre, _SyncManager } = require("@wyre-client/core");
const {
  createCon,
  insertPacketsReceived,
  insertSyncTime,
  createDataBase,
  useDb,
  setupSyncTimeTable,
  setupPacketsReceivedInChannelTable,
} = require("./db");

const URL = process.env.URL || "https://api-prod.wyre.live";
const MAX_CLIENTS = 500;
const POLLING_PERCENTAGE = 0.05;
const CLIENT_CREATION_INTERVAL_IN_MS = 50;
const EMIT_INTERVAL_IN_MS = 2000;

let clientCount = 0;
let lastReport = new Date().getTime();
let packetsSinceLastReport = 0;

const channels = ["longRunningTest1", "longRunningTest2", "longRunningTest3"];

const packetCounts = {};

const createClient = async (clientCount, con) => {
  // for demonstration purposes, some clients stay stuck in HTTP long-polling
  const transports =
    Math.random() < POLLING_PERCENTAGE ? ["polling"] : ["websocket"];

  packetsReceivedInChannel = {};

  for (const channel of channels) {
    packetsReceivedInChannel[channel] = 0;
  }

  packetCounts[clientCount] = {
    packetsReceivedInChannel,
  };

  const syncManager = new _SyncManager();
  for (let i = 0; i < channels.length; i++) {
    const timeNow = Date.now();
    let error = false;
    // const wyre = createWyre({
    //   data: { chessObj: [] },
    //   onChange: (() => {
    //     packetCounts[clientCount].packetsReceivedInChannel[channels[i]]++;
    //   }).bind(this),
    //   onSyncError: ((msg) => {
    //     error = true;
    //   }).bind(this),
    // });
    // const data = await wyre.init(channels[i]);
    const data = await syncManager.create({
      data: { chessObj: [] },
      refid: channels[i],
      onChange: (() => {
        packetCounts[clientCount].packetsReceivedInChannel[channels[i]]++;
      }).bind(this),
    });
    packetCounts[clientCount].packetsReceivedInChannel[channels[i]] =
      data.chessObj.length;
    const timeLoaded = Date.now();
    const timeTaken = (timeLoaded - timeNow) / 1000;
    // insertSyncTime(
    //   clientCount.toString(),
    //   channels[i],
    //   timeTaken.toString(),
    //   con
    // );
    // console.log(
    //   "time taken to init sync:",
    //   clientCount,
    //   channels[i],
    //   (timeLoaded - timeNow) / 1000
    // );
  }
};

const printReport = (con) => {
  // console.log(JSON.stringify(packetCounts, null, 2));
  Object.keys(packetCounts).map((key) => {
    const packetsReceivedInChannel = packetCounts[key].packetsReceivedInChannel;
    insertPacketsReceived(
      key,
      packetsReceivedInChannel.longRunningTest1.toString(),
      packetsReceivedInChannel.longRunningTest2.toString(),
      packetsReceivedInChannel.longRunningTest3.toString(),
      con
    );
  });
};

const setup = async () => {
  const DB_NAME = "testMultiNode";
  const con = await createCon();
  try {
    await createDataBase(DB_NAME, con);
  } catch (error) {
    console.error("db creation error", error);
  }
  await useDb(DB_NAME, con);
  try {
    await setupSyncTimeTable(con);
  } catch (error) {
    console.error("create sync time table", error);
  }
  try {
    await setupPacketsReceivedInChannelTable(con);
  } catch (error) {
    console.error("create packets received table", error);
  }
  setInterval(printReport, 5000, con);
  for (let i = 0; i < MAX_CLIENTS; i++) {
    console.log("[creating client]", i);
    await createClient(i, con);
    ++clientCount;
    await new Promise((resolve, reject) => {
      setTimeout(resolve, CLIENT_CREATION_INTERVAL_IN_MS);
    }, []);
  }
};

setup();
