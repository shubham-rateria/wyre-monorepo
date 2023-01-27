import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { Sync } from "reactive";

declare global {
  interface Window {
    sync: any;
  }
}

let r = (Math.random() + 1).toString(36).substring(7);

function useForceUpdate() {
  const [value, setValue] = React.useState(0); // integer state
  return () => setValue((value) => value + 1); // update state to force render
  // A function that increment 👆🏻 the previous state like here
  // is better than directly setting `setValue(value + 1)`
}

const d = {
  refid: "react-test-refid-1",
  arr: [1, 2, 3],
  value: 0,
  text: "hello\n",
};

function App() {
  const forceUpdate = useForceUpdate();

  const changeVal = () => {
    sync.value += 1;
    sync.text += "hello\n";
    forceUpdate();
  };

  const sync = React.useMemo(
    () =>
      Sync(d, "http://api.wyre.live:3002", { path: "/socket.io" }, () => {
        forceUpdate();
      }),
    []
  );
  window.sync = sync;

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        {/* {sync.arr.map((value: any) => (
          <p>{value}</p>
        ))} */}
        {sync.text}
        <button onClick={changeVal}>Update</button>
      </header>
    </div>
  );
}

export default App;
