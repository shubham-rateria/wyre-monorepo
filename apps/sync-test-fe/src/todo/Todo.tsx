import React from "react";
import { _SyncManager, Sync } from "@sam98231/reactive";
import { Button, Radio, Switch, Input, Col, Row } from "antd";

const SyncManager = new _SyncManager();

const initialTodos = [];
const MY_NAME = "Shubham Rateria";

function useForceUpdate() {
  const [value, setValue] = React.useState(0);
  return () => setValue((value) => value + 1);
}

type Todo = {
  text: string;
  done: boolean;
};

export const Todo: React.FC = () => {
  const forceUpdate = useForceUpdate();
  const [loaded, setLoaded] = React.useState(false);
  const [data, setData] = React.useState<any>([]);

  const onChange = (patch: any) => {
    console.log("[onChange]", patch);
    forceUpdate();
  };

  const load = async () => {
    setLoaded(false);
    await SyncManager.init();
    const data = Sync({ refid: "a-new-refid", todos: [] }, onChange);
    await data.sync();
    setData(data);
    console.log("loaded data", data);
    setLoaded(true);
  };

  React.useEffect(() => {
    load();
  }, []);

  const addNewTodo = () => {
    data.data.todos.push({
      text: "",
      done: false,
    });
    forceUpdate();
  };

  const handleTodoDoneChange = (todo: Todo, value: boolean) => {
    todo.done = value;
    forceUpdate();
  };

  const handleTodoTextChange = (todo: Todo, value: string) => {
    todo.text = value;
    forceUpdate();
  };

  if (!loaded) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>
        <Button onClick={forceUpdate}>Force Update</Button>
      </div>
      <div>
        <Button onClick={addNewTodo}>Add New Todo</Button>
      </div>
      <div>
        {data.data.todos.map((todo: Todo) => (
          <Row>
            <Col span={18}>
              <Input
                value={todo.text}
                placeholder="Enter Todo"
                onChange={(event) => {
                  handleTodoTextChange(todo, event.target.value);
                }}
              />
            </Col>
            <Col span={6}>
              <Switch
                checked={todo.done}
                onChange={(checked: boolean) => {
                  handleTodoDoneChange(todo, checked);
                }}
              />
            </Col>
          </Row>
        ))}
      </div>
    </div>
  );
};
