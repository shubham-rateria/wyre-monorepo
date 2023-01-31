import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { Sync } from "@sam98231/reactive";

function useForceUpdate() {
  const [value, setValue] = React.useState(0);
  return () => setValue((value) => value + 1);
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
    data.value += 1;
    forceUpdate();
  };

  const data = React.useMemo(
    () =>
      Sync(d, () => {
        forceUpdate();
      }),
    []
  );

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
        {data.value}
        <button onClick={changeVal}>Update</button>
      </header>
    </div>
  );
}

export default App;
