import { useEffect, useRef, useState } from "react";
import { SyncManager } from "@wyre-client/core";

interface UseSyncParams {
  data: any;
  collectionName: string;
  id: string;
  onChange?: (patch: any) => void;
}

export const useSync = (params: UseSyncParams) => {
  const [value, setValue] = useState(0);

  const onChange = (patch: any) => {
    console.log("[onChange]", patch);
    if (params.onChange) {
      params.onChange(patch);
    }
    setValue((value) => value + 1);
  };

  const init: (id?: string) => Promise<any> = async (id?: string) => {
    console.log("[useSync:init]");
    const loadedData: any = await SyncManager.create({
      data: params.data,
      collectionName: params.collectionName,
      refid: id || params.id,
      onChange,
    });
    // setData(loadedData);
    // console.log("[useSync:loaded]", loadedData, data);
    setValue((value) => value + 1);
    return loadedData;
  };

  return { init, value };
};
