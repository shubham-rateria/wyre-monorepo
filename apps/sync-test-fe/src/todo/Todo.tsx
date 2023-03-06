import { Button, Col, Input, Row, Space } from "antd";
import Modal from "antd/es/modal/Modal";
import React from "react";
import { useSync } from "../hooks/useSync";
import "./Todo.css";

type Todo = {
  text: string;
  done: boolean;
};

type SyncData = {
  todos: Todo[];
};

const initialData: SyncData = { todos: [] };

const TICKED_STYLE = {
  background: "#99d98c50",
  color: "#52b69a",
  fontWeight: "bolder",
};

export const Todo: React.FC = () => {
  const [loaded, setLoaded] = React.useState(true);
  const [data, setData] = React.useState<SyncData>(initialData);
  const [newTodoText, setNewTodoText] = React.useState("");
  const [roomLoaded, setRoomLoaded] = React.useState(false);
  const [roomName, setRoomName] = React.useState(
    Math.random().toString(36).slice(2)
  );

  const sync = useSync({
    data: initialData,
    collectionName: "Todo",
    id: "todos1",
  });

  const load = async () => {
    setLoaded(false);
    const loadedData = await sync.init(roomName);
    setData(loadedData);
    setLoaded(true);
  };

  // React.useEffect(() => {
  //   load();
  // }, []);

  const addNewTodo = () => {
    data.todos.push({
      text: newTodoText,
      done: false,
    });
    setNewTodoText("");
  };

  const toggleTodo = (todo: Todo) => {
    todo.done = !todo.done;
  };

  const handleTodoTextChange = (todo: Todo, value: string) => {
    todo.text = value;
  };

  const handleTodoDelete = (todo: Todo) => {
    const index = data.todos.indexOf(
      // @ts-ignore
      (_todo: Todo) => _todo.text === todo.text
    );
    if (index !== -1) {
      // @ts-ignore
      data.todos.delete(index);
    }
  };

  const handleNewTodoTextChange = (value: string) => {
    setNewTodoText(value);
  };

  const handleNewRoom = async () => {
    await load();
    setRoomLoaded(true);
  };

  if (!loaded) {
    return <div>Loading...</div>;
  }

  if (!roomLoaded) {
    return (
      <div className="container">
        <Modal
          open={true}
          okButtonProps={{ disabled: true }}
          cancelButtonProps={{ disabled: true }}
        >
          <p>
            <Button onClick={handleNewRoom}>Start New Room</Button> / {roomName}
          </p>
          <p>-- OR --</p>
          <p>
            <p>Enter Room ID</p>
            <p>
              <Input
                onChange={(e) => {
                  setRoomName(e.target.value);
                }}
              />
            </p>
            <p>
              <Button onClick={handleNewRoom}>Enter</Button>
            </p>
          </p>
        </Modal>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>My Todos</h1>
      <p>Room ID / {roomName}</p>
      <div className="actions">
        <div>
          <Space direction="horizontal">
            <Input
              placeholder="New Todo"
              onChange={(e) => handleNewTodoTextChange(e.target.value)}
              value={newTodoText}
            />
            <Button style={{ width: 120 }} onClick={addNewTodo}>
              Add Todo
            </Button>
          </Space>
        </div>
      </div>
      <div className="todo-list-container">
        {data.todos.length === 0 && (
          <h5>Nothing to do today. You've got a day to yourself :)</h5>
        )}
        {data.todos.map((todo: Todo, index: number) => (
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
