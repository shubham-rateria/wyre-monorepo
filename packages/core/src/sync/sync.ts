import { io } from "socket.io-client";
import { ObservableObject } from "../observables/object/observable-object";
import { serialize, serializeObject } from "../observables/utils/serialize";
import { TPatch } from "../types/patch.type";
import { cloneDeep } from "lodash";
import ObservableArray from "../observables/array/observable-array";
import isArrayType from "../helpers/isArrayType";

interface RegisterParams {
  collectionName: string;
  refid: string;
  data: any;
  onChange: (patch?: TPatch) => void;
}

interface DestroyParams {
  refid: string;
}

export interface ObjectData {
  data: typeof ObservableObject | typeof ObservableArray;
  state: State;
}

type State =
  | "CREATED"
  | "REGISTERING"
  | "REGISTERED"
  | "SYNCING"
  | "SYNCED"
  | "ONLINE"
  | "OFFLINE";

export class _SyncManager {
  socketEndpoint = "http://api.wyre.live:3002";
  socketConfig = { path: "/socket.io" };
  _io = io(this.socketEndpoint, this.socketConfig);
  socketId: string = "";
  objects: { [refid: string]: ObjectData } = {};

  async init() {
    this.socketId = await this.getSocketId();
  }

  async getSocketId(): Promise<string> {
    return new Promise((resolve, reject) => {
      this._io.on("connect", () => {
        resolve(this._io.id);
      });
    });
  }

  async register(roomName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this._io.emit("register", roomName);
      this._io.on("registerAck:" + roomName, () => {
        console.log("[register]:ack", roomName);
        resolve();
      });
    });
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

      this._io.on("sync:response:" + roomName, (data) => {
        const syncData = cloneDeep(data);
        console.log(
          "[sync:res]",
          roomName,
          syncData,
          typeof data,
          typeof syncData
        );
        clearTimeout(timer);
        resolve(data);
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
      this._io.emit("sync:response:" + roomName, data, socketId);
      console.log("[sync:request] sent", data, "sync:response:" + roomName);
    });
  }

  async setupPatchListener(
    data: typeof ObservableObject | typeof ObservableArray,
    onChange: (patch: TPatch) => void,
    roomName: string
  ) {
    this._io.on("syncPatches:" + roomName, (patch) => {
      console.log("[sync:newpatch]", patch);
      // @ts-ignore
      data.applyPatch(patch);
      onChange(patch);
    });
  }

  async signalReadyForRoom(roomName: string) {
    this._io.emit("ready:room", roomName);
  }

  async destroy(params: DestroyParams) {
    if (params.refid in this.objects) {
      delete this.objects[params.refid];
    }
    this._io.emit("destroy", params.refid);
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
      });
    } else {
      throw new Error(`We do not support ${typeof params.data} yet.`);
    }
    this.objects[params.refid] = {
      data: _data,
      state: "CREATED",
    };
    this.objects[params.refid].state = "REGISTERING";
    await this.register(params.refid);
    this.objects[params.refid].state = "REGISTERED";
    this.objects[params.refid].state = "SYNCING";
    const syncData = await this.sync(params.refid);
    console.log("[syncdata]", syncData);
    if (syncData) {
      // @ts-ignore
      _data.setRawValues(syncData);
    }
    this.objects[params.refid].state = "SYNCED";
    await this.setupPatchListener(_data, params.onChange, params.refid);
    await this.setupSyncRequestReceiver(params.refid);
    this.objects[params.refid].state = "ONLINE";
    await this.signalReadyForRoom(params.refid);
    return _data;
  }

  getPatchSendHandler = (roomName: string, collectionName: string) => {
    const patchSendHandler = async (patch: TPatch) => {
      patch.refid = roomName;
      patch.collectionName = collectionName;
      console.log("[patchemit]", patch);
      this._io.emit("patch", patch);
    };
    return patchSendHandler;
  };
}

export const SyncManager = new _SyncManager();
