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
