import { useState } from "react";
import { SyncManager } from "../sync/sync";

interface UseSyncParams {
  data: any;
  collectionName?: string;
  onChange?: () => void;
}

export const useSync = (params: UseSyncParams) => {
  const [value, setValue] = useState(0);
  const [loadedData, setLoadedData] = useState<any>();
  const [id, setId] = useState("");

  const onChange = () => {
    console.log("[onChange]");
    if (params.onChange) {
      params.onChange();
    }
    setValue((value) => value + 1);
  };

  const sync = async () => {
    const syncData = await SyncManager.sync(id);
    if (syncData) {
      // @ts-ignore
      loadedData.setRawValues(syncData);
      setValue((value) => value + 1);
    }
  };

  /**
   *
   * @param id the unique identifier for the data
   * @returns a javascript object that is real time and shared
   */
  const init: (id: string) => Promise<any> = async (id: string) => {
    console.log("[useSync:init]");
    setId(id);
    const loadedData: any = await SyncManager.create({
      data: params.data,
      collectionName: params.collectionName ?? "",
      refid: id ?? "",
      onChange,
    });
    setLoadedData(loadedData);
    setValue((value) => value + 1);
    return loadedData;
  };

  return { init, value, sync };
};
