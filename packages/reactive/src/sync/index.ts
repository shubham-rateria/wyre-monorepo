import io from "socket.io-client";
import Lamport from "../lamport";
import ObservableObject from "../observables/observable-object";

/**
 * We can do two things,
 * event emit when a new element is added to the output buffer and that gets sent.
 * check output buffer every second, and if any elements are present then output them
 */

type SyncParams = {
  obj: any;
};

export function Sync(obj, onChange) {
  let socketEndpoint = "http://localhost:3002";
  let socketConfig = { path: "/socket.io" };
  let outputBuffer = [];
  let _io = io(socketEndpoint, socketConfig);
  _io.connect();
  let _data = new ObservableObject(obj, _onChange);
  let lamports: { [refid: string]: Lamport } = {};
  let registered = false;

  function init() {
    _io.emit("register", _data.refid);

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
