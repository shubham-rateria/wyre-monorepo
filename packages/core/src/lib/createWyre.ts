import { SyncManager } from "../sync/sync";

interface UseSyncParams {
  data: any;
  collectionName?: string;
  onChange?: () => void;
}

export const createWyre = (params: UseSyncParams) => {
  const onChange = () => {
    console.log("[onChange]");
    if (params.onChange) {
      params.onChange();
    }
  };

  //   const sync = async () => {
  //     const syncData = await SyncManager.sync(id);
  //     if (syncData) {
  //       // @ts-ignore
  //       loadedData.setRawValues(syncData);
  //       setValue((value) => value + 1);
  //     }
  //   };

  /**
   *
   * @param id the unique identifier for the data
   * @returns a javascript object that is real time and shared
   */
  const init: (id: string) => Promise<any> = async (id: string) => {
    console.log("[createWyre:init]");
    const loadedData: any = await SyncManager.create({
      data: params.data,
      collectionName: params.collectionName ?? "",
      refid: id ?? "",
      onChange,
      onLocalChange: () => null,
    });
    return loadedData;
  };

  return { init };
};
