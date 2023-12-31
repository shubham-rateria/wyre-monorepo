import { useState } from "react";
import { SyncManager } from "@wyre-client/core";

interface UseSyncParams {
  data: any;
  collectionName: string;
  id: string;
}

export const useSync = (params: UseSyncParams) => {
  const [value, setValue] = useState(0);
  const [changeValue, setChangeValue] = useState(0);
  const [data, setData] = useState(params.data);

  const onChange = (patch: any) => {
    console.log("[onChange]");
    setValue((value) => value + 1);
  };

  const onSet = () => {
    console.log("[onChange]");
    setChangeValue((value) => value + 1);
  };

  const init = async () => {
    console.log("[useSync:init]");
    const loadedData = await SyncManager.create({
      data: params.data,
      collectionName: params.collectionName,
      refid: params.id,
      onChange,
      onSet,
    });
    setData(loadedData);
  };

  return [init, data, value];
};
