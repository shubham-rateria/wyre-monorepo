<br />
<div align="center">
  <a href="https://github.com/shubham-rateria/wyre-monorepo">
  <picture >
    <source media="(prefers-color-scheme: light)" srcset="https://docs.wyre.live/img/logo.png">
    <img width='100' alt="wyre" src="https://docs.wyre.live/img/logo.png">
  </picture>
</a>
</div>

# Installation

Let's install the Wyre library.

## Instructions

1. Tell npm about the private registry
```bash
npm config set @wyre-client:registry 'https://api.keygen.sh/v1/accounts/9fb6c504-8f2b-4497-9025-424775ea665d/artifacts/'
```

2. Use the activation code for access to the library
```bash
npm config set '//api.keygen.sh/v1/accounts/9fb6c504-8f2b-4497-9025-424775ea665d/artifacts/:_authToken' '{ACTIVATION_TOKEN}'
```

3. Install the library
```bash
npm install @wyre-client/core
```

## `createWyre`

The `createWyre` function is designed for synchronizing data between clients in real-time. 

### Importing the Hook

```javascript
import { createWyre } from "@wyre-client/core";
```

### Usage

Initialize the hook with some initial data. The data can be any javascript object or array.

```javascript
const sync = createWyre({
  data: {
    users: []
  },
  onChange: () => void
});
```

### Methods

#### `sync.init(id: string): Promise<object>`

This method does two things:

1. initializes the data synchronization for a specific item. It takes a string `id` as an argument, which uniquely identifies the item that needs to be synced.
2. syncs and therefore replicates the data object to another user using the same `uniqueId` for their `sync.init`

```javascript
const data = await sync.init(uniqueId);
```

Returns a promise that resolves to the synchronized data object.


## `usePresence` Hook

The `usePresence` hook is a custom hook designed to manage user presence information in real-time. This hook helps track user-related information like mouse position and state, user name, and user color.

### Importing the Hook

```javascript
import { usePresence } from "@wyre-client/core";
```

### Usage

Initialize the hook:

```javascript
const presence = usePresence();
```

### Methods

#### `presence.init({ presenceId: string }): Promise<IPresenceDetails>`

This method initializes the user's presence information. It takes two string arguments: `roomName`, which uniquely identifies the presence room, and `userName`, which represents the user's name.

```javascript
const presenceDetails = await presence.init({
  presenceId: "presenceRoom",
});
```

Returns a promise that resolves to an object containing the presence information for all connected users.

#### `presence.add(userDetails: object): void`

This method adds the user's presence information to the room. It takes an object `IUserDetails` as an argument, which contains the user's details, such as their name.

```javascript
presence.add({
  name,
});
```

## Using `presenceDetails` from the `usePresence` Hook

The `presenceDetails` variable returned from the `presence.init()` call is an object that contains presence information for all connected users. This information can be used to display user-specific UI elements, such as avatars and cursors, to visualize the real-time presence and activities of the users in the application.

### IPresenceDetails

The `IPresenceDetails` interface has the following structure:

```javascript
{
  users: {
    [userId: string]: {
      mousePosition: number[];
      mouseState: string;
      name: string;
      userColor: string;
    }
  }
}
```

### Displaying User Avatars

To display user avatars, iterate through the keys of the `presenceDetails.users` object and render the `Avatar` component for each user. The following code snippet demonstrates how to render user avatars using the `antd` library:

```javascript
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
```

### Displaying User Cursors

To display custom cursors for each user, iterate through the keys of the `presenceDetails.users` object and render the `Cursor` component for each user. This helps visualize the real-time mouse position and state of the users in the application. The following code snippet demonstrates how to render user cursors:

```javascript
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
```

## `useSync` Hook

The `useSync` hook is a custom hook designed for synchronizing data between clients in real-time. This hook provides an easy way to keep application data in sync among different users using the same application instance.

### Importing the Hook

```javascript
import { useSync } from "@wyre-client/core";
```

### Usage

Initialize the hook with some initial data. The data can be any javascript object or array.

```javascript
const sync = useSync({
  data: {
    users: []
  },
});
```

### Methods

#### `sync.init(id: string): Promise<object>`

This method does two things:

1. initializes the data synchronization for a specific item. It takes a string `id` as an argument, which uniquely identifies the item that needs to be synced.
2. syncs and therefore replicates the data object to another user using the same `uniqueId` for their `sync.init`

```javascript
const data = await sync.init(uniqueId);
```

Returns a promise that resolves to the synchronized data object.

# Arrays

Arrays (root level or nested) returned from the `useSync` `init()` call can be treated as a normal javascript array for modifications. Addition and deletion of items has to be done through the following methods.

The following array methods are currently available

## push

push a new value to the array

```javascript
arr.push(newValue);
```

This will add a new key `newKey` to the object with the value `"newValue"`.

## delete

delete value from an `index`:

```javascript
arr.delete(5);
```

This will remove the `key` from the object and mark it as deleted, making it unavailable for further access.

## indexOf

get the index of an element in the array:

```javascript
arr.indexOf(10);
```

## map

map through values in the array:

```javascript
arr.map(val => {...})
```

## length

get the length of the array

```javascript
arr.length
```

# Objects

Object returned from the `useSync` `init()` call can be treated as a normal javascript object for modifications. Addition and deletion of keys has to be done through the following methods.

Keys added and removed using `delete` keyword or through object assignment `obj[newKey] = newValue` will not track changes to `newKey`.

## Adding Keys

To add a new key to the data, you can use the `insert` method:

```javascript
obs.insert("newKey", newValue);
```

This will add a new key `newKey` to the object with the value `"newValue"`.

## Removing Keys

To remove a key from the data, you can use the `delete` method:

```javascript
obs.delete("key");
```

This will remove the `key` from the object and mark it as deleted, making it unavailable for further access.

## Modifying Data

To modify the data, you can use assignment operations as usual:

```javascript
obs.counter = obs.counter + 1;
```

## Iterating Over Keys and Values

The `Object.keys`, `Object.values` and `Object.entries` methods will not work as expected with objects returned by `sync.init`. Please use the following to iterate over keys:

### data.keys()

Iterate over keys in the root level or nested object. Example

```javascript
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
```


# Examples

### Simple Todo with Data sync and Presence

```javascript
import { Avatar, Button, Col, Input, Row, Space } from "antd";
import Modal from "antd/es/modal/Modal";
import React, { useState } from "react";
import { Cursor } from "../components/Cursor/Cursor";
import { useSync, usePresence } from "@wyre-client/core";
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

```
