import { useState } from "react";
import { SyncManager } from "@sam98231/reactive";

interface UseSyncParams {
  data: any;
  collectionName: string;
  id: string;
}

export const useSync = (params: UseSyncParams) => {
  const [value, setValue] = useState(0);
  const [data, setData] = useState(params.data);

  const onChange = (patch: any) => {
    console.log("[onChange]");
    setValue((value) => value + 1);
  };

  const init = async () => {
    console.log("[useSync:init]");
    const loadedData = await SyncManager.create({
      data: params.data,
      collectionName: params.collectionName,
      refid: params.id,
      onChange: onChange,
    });
    console.log("[useSync:loaded]", onChange);
    // onChange();
    setData(loadedData);
  };

  return [init, data, value];
};
