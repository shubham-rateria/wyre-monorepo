export type TimestampValue = {
  actorId: string;
  seq: number;
};

export class Timestamp {
  timestamp: TimestampValue;

  constructor(actorId: string = "", seq: number = 1) {
    this.timestamp = {
      actorId,
      seq,
    };
  }

  lessThan(timestamp: Timestamp) {
    if (this.timestamp.seq < timestamp.timestamp.seq) {
      return true;
    } else if (this.timestamp.seq === timestamp.timestamp.seq) {
      if (timestamp.timestamp.actorId === "") {
        return true;
      }
      return this.timestamp.actorId < timestamp.timestamp.actorId;
    }
  }

  increment() {
    this.timestamp.seq++;
  }
}

export default class Lamport {
  _timestamps: { [pathName: string]: number };

  constructor() {
    this._timestamps = {};
  }

  increment(path: string) {
    if (path in this._timestamps) {
      this._timestamps[path] += 1;
    } else {
      this._timestamps[path] = 2001;
    }
  }

  set(path: string, timestamp: number) {
    if (path in this._timestamps) {
      this._timestamps[path] = timestamp;
    } else {
      this._timestamps[path] = timestamp;
    }
  }

  get(path: string) {
    if (path in this._timestamps) {
      return this._timestamps[path];
    }
  }
}
