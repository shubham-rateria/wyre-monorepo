import React from "react";
import { _SyncManager } from "@sam98231/reactive";
import { Button, InputNumber } from "antd";

const SyncManager = new _SyncManager();

function useForceUpdate() {
  const [value, setValue] = React.useState(0);
  return () => setValue((value) => value + 1);
}

type Todo = {
  text: string;
  done: boolean;
};

const initData = {
  counter: 1,
};

function getRandomString() {
  return (Math.random() + 1).toString(36).substring(7);
}

export const Dict: React.FC = () => {
  const forceUpdate = useForceUpdate();
  const [loaded, setLoaded] = React.useState(false);
  const [data, setData] = React.useState<any>([]);

  const load = async () => {
    setLoaded(false);
    await SyncManager.init();
    const data = await SyncManager.create({
      data: {},
      collectionName: "Dict",
      onChange() {
        forceUpdate();
      },
      refid: "sample-testing-125",
    });
    setData(data);
    console.log("loaded data", data);
    setLoaded(true);
  };

  React.useEffect(() => {
    load();
  }, []);

  const addNewDict = () => {
    data.insert(getRandomString(), initData);
    forceUpdate();
  };

  const handleCounterUpdate = (key: string, value: number) => {
    data[key].counter = value;
    forceUpdate();
  };

  const handleDeleteDict = (key: string) => {
    data.delete(key);
    forceUpdate();
  };

  if (!loaded) {
    return <div>Loading...</div>;
  }

  console.log("[values]", Array.from(data.keys()));

  return (
    <div>
      <div>
        <Button onClick={forceUpdate}>Force Update</Button>
      </div>
      <div>
        <Button onClick={addNewDict}>Add New Dict</Button>
        {data.keys().map((key: string) => (
          <div>
            <InputNumber
              min={0}
              max={100}
              value={data[key].counter}
              onChange={(val) => {
                handleCounterUpdate(key, val);
              }}
            />
            <Button
              onClick={() => {
                handleDeleteDict(key);
              }}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
      <div></div>
    </div>
  );
};
