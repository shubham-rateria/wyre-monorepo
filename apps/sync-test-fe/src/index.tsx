import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Todo } from "./todo/Todo";
import reportWebVitals from "./reportWebVitals";
import { Counter } from "./Counter/Counter";
import { MultipleInputs } from "./MultipleInputs/MultipleInputs";
import { Dict } from "./Dict/Dict";
import { Sudoku } from "./Sudoku/Sudoku";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  // <React.StrictMode>
  <Todo />
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
