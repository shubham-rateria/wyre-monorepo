import React from "react";
import { _SyncManager } from "@sam98231/reactive";
import { InputNumber } from "antd";

const SyncManager = new _SyncManager();

function useForceUpdate() {
  const [value, setValue] = React.useState(0);
  return () => setValue((value) => value + 1);
}

export const Counter = () => {
  const forceUpdate = useForceUpdate();
  const [loaded, setLoaded] = React.useState(false);
  const [data, setData] = React.useState<any>([]);

  const load = async () => {
    setLoaded(false);
    await SyncManager.init();
    const data = await SyncManager.create({
      data: { counter: 0 },
      collectionName: "Todo",
      onChange() {
        forceUpdate();
      },
      refid: "sample-testing-14",
    });
    setData(data);
    console.log("loaded data", data);
    setLoaded(true);
  };

  const changeInputNumberVal = (value: number) => {
    data.counter = value;
    forceUpdate();
  };

  React.useEffect(() => {
    load();
  }, []);

  if (!loaded) {
    return <div>loading</div>;
  }

  return (
    <InputNumber
      min={0}
      max={100}
      value={data.counter}
      onChange={(val) => {
        changeInputNumberVal(val);
      }}
    />
  );
};
