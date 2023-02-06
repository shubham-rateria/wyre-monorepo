import { Timestamp } from "../lamport";

export type TValue = {
  value: any;
  tombstone: boolean;
  timestamp: Timestamp;
  isPrimitive: boolean;
};
