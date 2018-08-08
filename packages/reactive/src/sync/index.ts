import io from "socket.io-client";
import Lamport from "../lamport";
import ObservableObject from "../observables/object/observable-object";
import { serializeObject } from "../observables/utils/serialize";

/**
 * We can do two things,
 * event emit when a new element is added to the output buffer and that gets sent.
 * check output buffer every second, and if any elements are present then output them
 */

type SyncParams = {
  obj: any;
};

type State =
  | "CREATED"
  | "REGISTERING"
  | "REGISTERED"
  | "SYNCING"
  | "SYNCED"
  | "ONLINE"
  | "OFFLINE";

export function Sync(obj, onChange, actorId = "") {
  let socketEndpoint = "http://localhost:3002";
  let socketConfig = { path: "/socket.io" };
  let outputBuffer = [];
  let _io = io(socketEndpoint, socketConfig);
  let _data = new ObservableObject(obj, _onChange, actorId);
  let lamports: { [refid: string]: Lamport } = {};
  let registered = false;
  let socketId: string = "";
  let state: State = "CREATED";

  async function getSocketId(): Promise<string> {
    return new Promise((resolve, reject) => {
      _io.on("connect", () => {
        resolve(_io.id);
      });
    });
  }

  async function sync() {
    return new Promise((resolve, reject) => {
      _io.emit("sync:request:" + _data.refid);

      const timer = setTimeout(() => {
        reject(new Error(`Promise timed out after ${10000} ms`));
      }, 10000);

      _io.on("sync:response:" + _data.refid, (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }

  async function init() {
    _io.connect();

    socketId = await getSocketId();

    _io.emit("register", _data.refid);

    state = "REGISTERING";

    _io.on("syncPatches", (data) => {
      console.log("[SYNCPATCH]", data);
      if (!(data.refid in lamports)) {
        lamports[data.refid] = new Lamport();
      }
      lamports[data.refid].set(data.path, data.lamportTimestamp);
      _data.applyPatch(data);
      onChange();
    });

    _io.on("registerAck", () => {
      registered = true;
      state = "REGISTERED";
    });

    /**
     * TODO: wait for self registration to finish before a sync:request can be processed
     */

    _io.on("sync:request:" + _data.refid, () => {
      const data = serializeObject(_data);
      _io.emit("sync:response:" + _data.refid, data);
    });

    outputBuffer = [];
  }

  function add(data) {
    if (!(data.refid in lamports)) {
      lamports[data.refid] = new Lamport();
    }
    lamports[data.refid].increment(data.path);
    data.lamportTimestamp = lamports[data.refid].get(data.path);
    _io.emit("patch", data);
  }

  function sendPatch(patch) {
    _io.emit("patch", patch);
  }

  function _onChange(patch) {
    patch.refid = _data.refid;
    // increment the lamport timestamp
    if (!(patch.refid in lamports)) {
      lamports[patch.refid] = new Lamport();
    }
    lamports[patch.refid].increment(patch.path);
    console.log("[change]", patch);
    add(patch);
  }

  init();

  return { data: _data, add, lamports, io: _io };
}
