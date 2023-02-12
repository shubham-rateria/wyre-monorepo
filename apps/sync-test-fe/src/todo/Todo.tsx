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
  const [data1, setData1] = React.useState<any>([]);

  const load = async () => {
    setLoaded(false);
    await SyncManager.init();
    const data = await SyncManager.create({
      data: { todos: [] },
      collectionName: "Todo",
      onChange() {
        forceUpdate();
      },
      refid: "sample-testing-200",
    });
    const data1 = await SyncManager.create({
      data: { todos: [] },
      collectionName: "Todo",
      onChange() {
        forceUpdate();
      },
      refid: "sample-testing-1900",
    });
    setData(data);
    setData1(data1);
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

  const addNewTodo1 = () => {
    data1.todos.push({
      text: (data1.todos.length + 1).toString(),
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

  const handleTodo1Delete = (todo: Todo) => {
    const index = data1.todos.indexOf(
      (_todo: Todo) => _todo.text === todo.text
    );
    console.log("[deleting todo at index]", index, data.todos[index]);
    if (index !== -1) {
      data1.todos.delete(index);
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
        <Button onClick={addNewTodo1}>Add New Todo 1</Button>
      </div>
      <div>
        <Row>
          <Col span={12}>
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
          </Col>
          <Col span={12}>
            {data1.todos.map((todo: Todo, index: number) => (
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
                        handleTodo1Delete(todo);
                      }}
                    >
                      D
                    </Button>
                  </Col>
                </Col>
              </Row>
            ))}
          </Col>
        </Row>
      </div>
    </div>
  );
};
