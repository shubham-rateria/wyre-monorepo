import { io } from "socket.io-client";
import { ObservableObject } from "../observables/object/observable-object";
import { serialize, serializeObject } from "../observables/utils/serialize";
import { TPatch } from "../types/patch.type";
import ObservableArray from "../observables/array/observable-array";
import isArrayType from "../helpers/isArrayType";
import notepack from "notepack.io";

interface RegisterParams {
  collectionName: string;
  refid: string;
  data: any;
  onChange: (patch?: TPatch) => void;
  onLocalChange: () => void;
  name?: string;
  onConnect?: () => void;
  onSyncError?: (message: string) => void;
}

interface DestroyParams {
  refid: string;
}

export interface ObjectData {
  data: typeof ObservableObject | typeof ObservableArray;
  state: State;
  onChange: (patch?: TPatch) => void;
  onConnect?: () => void;
}

type State =
  | "CREATED"
  | "REGISTERING"
  | "REGISTERED"
  | "SYNCING"
  | "SYNCED"
  | "ONLINE"
  | "OFFLINE";

type UserDetails = {
  name: string;
  socketId: string;
};

export class _SyncManager {
  // socketEndpoint = "http://api.wyre.live:3002";
  // socketEndpoint = "https://api-prod.wyre.live";
  socketEndpoint = "https://api-dev.wyre.live";
  // socketEndpoint = "http://localhost:3002";
  // socketEndpoint = "http://3.109.46.246:3002";
  socketConfig = {
    path: "/socket.io",
    transports: ["websocket"],
    upgrade: false,
  };
  public _io = io(this.socketEndpoint, this.socketConfig);
  socketId: string = "";
  objects: { [refid: string]: ObjectData } = {};
  peopleInRoom: { [refid: string]: UserDetails[] } = {};
  wasPreviouslyDisconnected: boolean = false;

  constructor() {
    this.init();
  }

  async init() {
    this.socketId = await this.getSocketId();
    this.setupAliveListener();
    this.setupSyncReadyListener();

    this._io.on("reconnect", () => {
      console.log("reconnected...");
    });

    this._io.on("disconnect", () => {
      console.log("disconnected...");
      this.wasPreviouslyDisconnected = true;
    });
  }

  async reSync() {
    Object.keys(this.objects).forEach(async (id: string) => {
      this.objects[id].state = "REGISTERING";
      await this.register(id, "");
      this.objects[id].state = "REGISTERED";
      this.objects[id].state = "SYNCING";
      try {
        const syncData = await this.sync(id);
        if (syncData) {
          // @ts-ignore
          this.objects[id].data.setRawValues(syncData);
        }
      } catch (error) {
        console.error("Could not initial sync.");
      }

      if (this.objects[id].onConnect) {
        // @ts-ignore
        this.objects[id].onConnect();
      }
      this.objects[id].onChange();
    });
  }

  async getSocketId(): Promise<string> {
    return new Promise((resolve, reject) => {
      this._io.on("connect", () => {
        if (this.wasPreviouslyDisconnected) {
          console.log("reconnected...");
          this.reSync();
        } else {
          console.log("connected...");
        }
        this.wasPreviouslyDisconnected = false;

        resolve(this._io.id);
      });
    });
  }

  async register(roomName: string, name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this._io.emit("register", roomName, name);
      this._io.on("registerAck:" + roomName, () => {
        console.log("[register]:ack", roomName);
        resolve();
      });
    });
  }

  async getUsersInRoom(roomName: string): Promise<UserDetails[]> {
    return new Promise((resolve, reject) => {
      this._io.emit("room:users", roomName);
      this._io.on("room:users:" + roomName, (usersInRoom) => {
        console.log("room:users:" + roomName, usersInRoom);
        resolve(usersInRoom);
      });
    });
  }

  async setupAliveListener() {
    this._io.on("sync:alive", (callback) => {
      callback("ok");
    });
  }

  async setupSyncReadyListener() {
    this._io.on(
      "sync:ready",
      ((roomName, callback) => {
        if (
          roomName in this.objects &&
          this.objects[roomName].state === "ONLINE"
        ) {
          callback({
            ready: true,
          });
        } else {
          callback({
            ready: false,
          });
        }
      }).bind(this)
    );
  }

  async sync(roomName: string) {
    return new Promise((resolve, reject) => {
      this._io.emit("sync:request", roomName);
      console.log("[sync:req:sent]", roomName);

      const timer = setTimeout(() => {
        reject(new Error(`Promise timed out after ${10000} ms`));
      }, 10000);

      this._io.on("sync:request:no-user:" + roomName, () => {
        clearTimeout(timer);
        resolve(null);
      });

      this._io.on("sync:response:" + roomName, (dataBuffer) => {
        // const syncData = cloneDeep(data);
        // console.log(
        //   "[sync:res]:dataBuffer",
        //   roomName,
        //   dataBuffer,
        //   dataBuffer.toString()
        // );
        // let data = notepack.decode(new Uint8Array(dataBuffer));
        console.log("[sync:res]", roomName, dataBuffer);
        clearTimeout(timer);
        resolve(dataBuffer);
      });
    });
  }

  async setupSyncRequestReceiver(roomName: string) {
    this._io.on("sync:request:" + roomName, (socketId: string) => {
      console.log("[sync:request] received", roomName);
      if (!(this.objects[roomName].state === "ONLINE")) {
        console.log(
          "[sync:request]:no-sync",
          roomName,
          this.objects[roomName].state
        );
        this._io.emit("sync:no-sync", roomName, socketId);
      }
      const data = serialize(this.objects[roomName].data);
      // const dataBuffer = notepack.encode(data);
      this._io.emit("sync:response:" + roomName, data, socketId);
      console.log("[sync:request] sent", data, "sync:response:" + roomName);
    });
  }

  async setupPatchListener(
    data: typeof ObservableObject | typeof ObservableArray,
    onChange: (patch: TPatch) => void,
    roomName: string
  ) {
    this._io.on("syncPatches:" + roomName, (patchBuffer) => {
      console.log("[sync:newpatch:buffer]", patchBuffer);

      // let patch = notepack.decode(new Uint8Array(patchBuffer));
      let patch = patchBuffer;

      console.log("[sync:newpatch]", patch);
      // @ts-ignore
      data.applyPatch(patch);
      // onChange(patch);
    });
  }

  async destroy(params: DestroyParams) {
    if (params.refid in this.objects) {
      delete this.objects[params.refid];
    }
    this._io.emit("destroy", params.refid);
  }

  async setupEventListener(eventName: string, callback: (data: any) => void) {
    console.log("setting up event listener", eventName);
    this._io.on(eventName, (data) => {
      console.log("[event:received]", eventName, data);
      callback(data);
    });
  }

  async create(
    params: RegisterParams
  ): Promise<typeof ObservableObject | typeof ObservableArray> {
    if (params.refid in this.objects) {
      return this.objects[params.refid].data;
    }

    /**
     * check the type of params.data
     */

    let _data: typeof ObservableArray | typeof ObservableObject;

    if (isArrayType(params.data)) {
      _data = new ObservableArray({
        items: params.data,
        emitPatch: this.getPatchSendHandler(
          params.refid,
          params.collectionName
        ),
        actorId: this.socketId,
        collectionName: params.collectionName,
        onChange: params.onChange,
        onLocalChange: params.onLocalChange,
      });
    } else if (typeof params.data === "object" && params.data !== null) {
      _data = new ObservableObject({
        object: params.data,
        emitPatch: this.getPatchSendHandler(
          params.refid,
          params.collectionName
        ),
        actorId: this.socketId,
        collectionName: params.collectionName,
        onChange: params.onChange,
        onLocalChange: params.onLocalChange,
      });
    } else {
      throw new Error(`We do not support ${typeof params.data} yet.`);
    }
    this.objects[params.refid] = {
      data: _data,
      state: "CREATED",
      onChange: params.onChange,
      onConnect: params.onConnect,
    };
    this.objects[params.refid].state = "REGISTERING";
    console.log("registering");
    await this.register(params.refid, params.name || "");
    console.log("registered");
    this.objects[params.refid].state = "REGISTERED";
    this.objects[params.refid].state = "SYNCING";
    try {
      const syncData = await this.sync(params.refid);
      console.log("[syncdata]", syncData);
      if (syncData) {
        // @ts-ignore
        _data.setRawValues(syncData);
      }
    } catch (error) {
      console.error("Could not initial sync.");
      if (params.onSyncError) {
        params.onSyncError("Could not initial sync:" + error);
      }
    }

    this.objects[params.refid].state = "SYNCED";
    await this.setupPatchListener(_data, params.onChange, params.refid);
    await this.setupSyncRequestReceiver(params.refid);
    this.objects[params.refid].state = "ONLINE";
    return this.objects[params.refid].data;
  }

  getPatchSendHandler = (roomName: string, collectionName: string) => {
    const patchSendHandler = async (patch: TPatch) => {
      patch.collectionName = collectionName;
      patch.actorId = this._io.id;
      patch.socketId = this._io.id;
      // const buffer = notepack.encode(patch);
      console.log("[patch:sending]", patch);
      this._io.emit("patch", roomName, patch);
    };
    return patchSendHandler;
  };
}

export const SyncManager = new _SyncManager();
