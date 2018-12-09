import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Todo } from "./todo/Todo";
import reportWebVitals from "./reportWebVitals";
import { Counter } from "./Counter/Counter";
import { MultipleInputs } from "./MultipleInputs/MultipleInputs";
import { Dict } from "./Dict/Dict";
import { Presence } from "./Presence/Presence";
import { LiveComments } from "./LiveComments/LiveComments";
import { TestGCL } from "./LiveComments/TestGCL";
import { StreamerTest } from "./StreamerTest/StreamerTest";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<Todo />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
