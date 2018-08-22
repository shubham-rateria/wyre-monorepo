import { Button, Col, Input, Row, Switch } from "antd";
import React from "react";
import { useSync } from "../hooks/useSync";
import "./Todo.css";

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

const TICKED_STYLE = {
  background: "#99d98c50",
  color: "#52b69a",
  fontWeight: "bolder",
};

export const Todo: React.FC = () => {
  const forceUpdate = useForceUpdate();
  const [loaded, setLoaded] = React.useState(false);

  const [init, data] = useSync({
    data: { todos: [] },
    collectionName: "Todo",
    id: "id13",
  });

  const load = async () => {
    setLoaded(false);
    await init();
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
  };

  const handleTodoDoneChange = (todo: Todo, value: boolean) => {
    todo.done = value;
  };

  const toggleTodo = (todo: Todo) => {
    todo.done = !todo.done;
  };

  const handleTodoTextChange = (todo: Todo, value: string) => {
    todo.text = value;
  };

  const handleTodoDelete = (todo: Todo) => {
    const index = data.todos.indexOf((_todo: Todo) => _todo.text === todo.text);
    console.log("[deleting todo at index]", index, data.todos[index]);
    if (index !== -1) {
      data.todos.delete(index);
      // forceUpdate();
    }
  };

  if (!loaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <h1>My Todos</h1>
      <div className="actions">
        {/* <div>
          <Button onClick={forceUpdate}>Force Update</Button>
        </div> */}
        <div>
          <Button onClick={addNewTodo}>Add New Todo</Button>
        </div>
      </div>
      <div className="todo-list-container">
        {data?.todos.map((todo: Todo, index: number) => (
          <Row className="todo-item">
            <Col span={17}>
              <Input
                value={todo.text}
                placeholder="Enter Todo"
                onChange={(event) => {
                  handleTodoTextChange(todo, event.target.value);
                }}
              />
            </Col>
            <Col span={2}>
              <Button
                style={todo.done ? TICKED_STYLE : {}}
                shape="circle"
                ghost
                type="text"
                onClick={() => toggleTodo(todo)}
              >
                ✓
              </Button>
            </Col>
            <Col span={3}>
              <Button
                onClick={() => {
                  handleTodoDelete(todo);
                }}
                shape="circle"
                danger
                type="text"
              >
                🗑
              </Button>
            </Col>
          </Row>
        ))}
      </div>
    </div>
  );
};
