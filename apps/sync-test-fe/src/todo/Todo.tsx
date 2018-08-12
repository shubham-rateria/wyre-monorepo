import React from "react";
import { _SyncManager } from "@sam98231/reactive";
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

  const load = async () => {
    setLoaded(false);
    await SyncManager.init();
    const data = await SyncManager.create({
      data: { todos: [] },
      collectionName: "Todo",
      onChange() {
        forceUpdate();
      },
      refid: "sample-testing-120",
    });
    setData(data);
    console.log("loaded data", data);
    setLoaded(true);
  };

  React.useEffect(() => {
    load();
  }, []);

  const addNewTodo = () => {
    data.todos.push({
      text: (data.todos.length + 1).toString(),
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

  const handleTodoDelete = (todo: Todo) => {
    const index = data.todos.indexOf((_todo: Todo) => _todo.text === todo.text);
    console.log("[deleting todo at index]", index, data.todos[index]);
    if (index !== -1) {
      data.todos.delete(index);
      forceUpdate();
    }
  };

  if (!loaded) {
    return <div>Loading...</div>;
  }

  console.log(
    "[todos]",
    data.todos.map((val: any) => val)
  );

  return (
    <div>
      <div>
        <Button onClick={forceUpdate}>Force Update</Button>
      </div>
      <div>
        <Button onClick={addNewTodo}>Add New Todo</Button>
      </div>
      <div>
        {data.todos.map((todo: Todo, index: number) => (
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
            <Col span={3}>
              <Switch
                checked={todo.done}
                onChange={(checked: boolean) => {
                  handleTodoDoneChange(todo, checked);
                }}
              />
              <Col span={3}>
                <Button
                  onClick={() => {
                    handleTodoDelete(todo);
                  }}
                >
                  D
                </Button>
              </Col>
            </Col>
          </Row>
        ))}
      </div>
    </div>
  );
};