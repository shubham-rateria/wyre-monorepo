// @ts-nocheck
import { Avatar, Button, Col, Input, Row, Space } from "antd";
import Modal from "antd/es/modal/Modal";
import React, { useState } from "react";
import { Cursor } from "../components/Cursor/Cursor";
import { usePresence } from "../hooks/usePresence";
// import { useSync } from "../hooks/useSync";
import { useSync } from "@wyre-client/core";
import { getInitials } from "../utils/get-initials";
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
  /**
   * have we loaded everything?
   */
  const [loaded, setLoaded] = useState(true);

  /**
   * real time collaborative data
   */
  const [data, setData] = useState<SyncData>(initialData);

  /**
   * users presence details
   */
  const [presenceDetails, setPresenceDetails] = useState<any>(null);

  /**
   * text for a new todo
   */
  const [newTodoText, setNewTodoText] = useState("");

  /**
   * Has the user entered details
   */
  const [detailsEntered, setDetailsEntered] = useState(false);

  /**
   * The id of this todo list
   */
  const [todoId, setTodoId] = useState("");

  /**
   * Your name
   */
  const [name, setName] = useState("");

  /**
   * This is where the magic happens
   */
  const sync = useSync({
    data: initialData,
  });
  const presence = usePresence();

  const load = async () => {
    setLoaded(false);
    const data = await sync.init(todoId);

    /**
     * interface IUserDetails {
     *  mousePosition: number[];
     *  mouseState: MOUSE_STATE;
     *  name: string;
     *  userColor: string;
     * }
     *
     * interface IRoomData {
     *  users: { userId: IUserDetails }
     * }
     *
     */
    const presenceDetails = await presence.init({
      presenceId: "todopresence101",
    });
    presence.add({
      name,
    });
    setPresenceDetails(presenceDetails);
    setData(data);
    setLoaded(true);
  };

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
    const index = data.todos.indexOf((_todo: Todo) => _todo.text === todo.text);
    if (index !== -1) {
      data.todos.delete(index);
    }
  };

  const handleNewTodoTextChange = (value: string) => {
    setNewTodoText(value);
  };

  const handleTodoCreate = async () => {
    await load();
    setDetailsEntered(true);
  };

  if (!loaded) {
    return <div>Loading...</div>;
  }

  if (!detailsEntered) {
    return (
      <div className="container">
        <Modal
          open={true}
          okButtonProps={{ disabled: true }}
          cancelButtonProps={{ disabled: true }}
        >
          <div>
            <p>Enter Your Name</p>
            <p>
              <Input
                onChange={(e) => {
                  setName(e.target.value);
                }}
              />
            </p>
          </div>
          <div>
            <p>Enter Todo ID</p>
            <p>
              <Input
                onChange={(e) => {
                  setTodoId(e.target.value);
                }}
              />
            </p>
            <p>
              <Button onClick={handleTodoCreate}>Enter</Button>
            </p>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="avatars">
        <Avatar.Group>
          {presenceDetails?.users.keys().map((userId: string) => {
            return (
              <Avatar
                style={{
                  backgroundColor: presenceDetails.users[userId].userColor,
                }}
              >
                {getInitials(presenceDetails.users[userId].name)}
              </Avatar>
            );
          })}
        </Avatar.Group>
      </div>
      {presenceDetails?.users.keys().map((userId: string) => {
        return (
          <div
            style={{
              top: presenceDetails.users[userId].mousePosition[0],
              left: presenceDetails.users[userId].mousePosition[1],
            }}
            className="cursor"
          >
            <Cursor color={presenceDetails.users[userId].userColor} />
            <div>{presenceDetails.users[userId].mouseState}</div>
          </div>
        );
      })}
      <h1>My Todos</h1>
      <p>Todo ID / {todoId}</p>
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
