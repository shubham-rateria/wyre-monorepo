import React from "react";
import { InputNumber } from "antd";
import styles from "./Counter.module.css";
import { createWyre } from "@wyre-client/core";

type SyncData = { counter: number };

const initialState: SyncData = {
  counter: 0,
};

export const Counter = () => {
  const [loaded, setLoaded] = React.useState(false);
  const [data, setData] = React.useState<SyncData>(initialState);
  const [value, setValue] = React.useState(0);

  const onChange = () => {
    console.log("[onChange]", data);
    setValue((value) => value + 1);
  };

  const load = async () => {
    setLoaded(false);
    const sync = createWyre({
      data: initialState,
      onChange,
    });
    const loadedData = await sync.init("test:no-hook");
    setData(loadedData);
    setLoaded(true);
  };

  const changeInputNumberVal = (value: number) => {
    console.log("[changeInputNumberVal]", value);
    data.counter = value;
    onChange();
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
