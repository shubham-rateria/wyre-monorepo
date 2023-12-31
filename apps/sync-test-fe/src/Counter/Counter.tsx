import React from "react";
import { useSync } from "@wyre-client/core";
import { InputNumber } from "antd";
import styles from "./Counter.module.css";

type SyncData = { counter: number };

const initialState: SyncData = {
  counter: 0,
};

export const Counter = () => {
  const [loaded, setLoaded] = React.useState(false);
  const [data, setData] = React.useState<SyncData>(initialState);

  const sync = useSync({
    data: initialState,
  });

  const load = async () => {
    setLoaded(false);
    const loadedData = await sync.init("counter:1");
    setData(loadedData);
    setLoaded(true);
  };

  const changeInputNumberVal = (value: number) => {
    console.log("[changeInputNumberVal]", value);
    data.counter = value;
  };

  React.useEffect(() => {
    load();
  }, []);

  if (!loaded) {
    return <div>loading</div>;
  }

  return (
    <div className={styles.Container}>
      <h3>Basic Counter</h3>
      <InputNumber
        min={0}
        max={100}
        value={data.counter}
        onChange={(val) => {
          if (val) {
            changeInputNumberVal(val);
          } else {
            changeInputNumberVal(0);
          }
        }}
      />
    </div>
  );
};
