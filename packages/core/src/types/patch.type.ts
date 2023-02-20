export type TPatch = {
  op: "add" | "remove" | "replace" | "insert";
  path: string;
  value?: any;
  actorId: string;
  seq: number;
  collectionName?: string;
  refid?: string;
};
