import { Timestamp } from "../lamport";

export interface TValue {
  value: any;
  tombstone: boolean;
  timestamp: Timestamp;
  isPrimitive: boolean;
}
