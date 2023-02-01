import { Timestamp } from "../../lamport";

export class Register {
  value: number | string | null | undefined;
  timestamp: Timestamp;

  constructor(
    value: number | string | null | undefined,
    actorId: string = "",
    seq: number = 1
  ) {
    this.value = value;
    this.timestamp = new Timestamp(actorId, seq);
  }

  set(value: number | string | null | undefined, timestamp: Timestamp) {
    /**
     * check if this value can be set
     * by comparing timestamps
     *
     * if yes, update value and timestamp
     */

    if (this.timestamp.lessThan(timestamp)) {
      this.value = value;
      this.timestamp = timestamp;
    }
  }
}
