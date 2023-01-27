import io from "socket.io-client";
import ObservableObject from "../observables/observable-object";

/**
 * We can do two things,
 * event emit when a new element is added to the output buffer and that gets sent.
 * check output buffer every second, and if any elements are present then output them
 */

export function Sync(
  obj,
  socketEndpoint = "http://localhost:3002",
  socketConfig = { path: "/socket.io" },
  onChange
) {
  let outputBuffer = [];
  let _io = io(socketEndpoint, socketConfig);
  _io.connect();
  let _data = new ObservableObject(obj, _onChange);
  let registered = false;

  function init() {
    _io.emit("register", _data.refid);

    _io.on("syncPatches", (data) => {
      _data.applyPatch(data);
      console.log("[SYNCPATCH]", data);
      onChange();
    });

    _io.on("registerAck", () => {
      registered = true;
    });

    outputBuffer = [];
  }

  function add(data) {
    _io.emit("patch", data);
  }

  function sendPatch(patch) {
    _io.emit("patch", patch);
  }

  function _onChange(patch) {
    patch.refid = _data.refid;
    console.log("[change]", patch);
    add(patch);
  }

  init();

  return _data;
}
