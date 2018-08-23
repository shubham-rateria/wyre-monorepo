import sudoku from "../utils/sudoku";
import React from "react";
import { SyncManager } from "@wyre-client/core";
import { useState } from "react";

const ROWS = 9;
const COLS = 9;

function useForceUpdate() {
  const [value, setValue] = React.useState(0);
  return () => setValue((value) => value + 1);
}

interface GridData {
  readOnly: boolean;
  value: string;
  error: boolean;
}

export const Sudoku: React.FC = () => {
  const forceUpdate = useForceUpdate();
  const [data, setData] = useState<any>([]);
  const stateRef = React.useRef<any>();

  const listenForChanges = (patch: any) => {
    forceUpdate();
  };

  const loadData = async () => {
    const initialData = { grid: [], candidates: [] };
    const data = await SyncManager.create({
      data: initialData,
      collectionName: "sudoku",
      refid: "sudoku1",
      onChange: (patch) => listenForChanges(patch),
      onSet: () => forceUpdate(),
    });
    return data;
  };

  const [candidates, setCandidates] = React.useState<any>([]);
  const [loaded, setLoaded] = React.useState(false);

  const generateGrid = () => {
    const sudokuString = sudoku.generate("medium");
    const newGrid = sudoku.board_string_to_grid(sudokuString);
    const candidates = sudoku.get_candidates(sudokuString);
    let transformedGrid: GridData[][] = Array(ROWS).fill(
      Array(COLS).fill(undefined)
    );
    for (let i = 0; i < newGrid.length; i++) {
      for (let j = 0; j < newGrid[i].length; j++) {
        transformedGrid[i][j] = {
          value: newGrid[i][j] === "." ? "" : newGrid[i][j],
          readOnly: true,
          error: false,
        };
      }
    }
    return { grid: transformedGrid, candidates };
  };

  React.useEffect(() => {
    loadData().then((data: any) => {
      if (data.grid?.length === 0) {
        const { grid, candidates } = generateGrid();
        data.grid = grid;
        data.candidates = candidates;
      }
      console.log("[data:grid]", data.grid);
      stateRef.current = data;
      setData(data);
      setLoaded(true);
    });
  }, []);

  if (!loaded) {
    return <div>Loading...</div>;
  }

  const handleValueChange = (rIndex: number, cIndex: number, value: string) => {
    if (parseInt(value) >= 10) {
      return;
    }
    data.grid[rIndex][cIndex].value = value;

    const toString = sudoku.board_grid_to_string(data.toJSON().grid || []);
    const candidates: any[][] | boolean = sudoku.get_candidates(toString);
    console.log("[candidates]", candidates);
    if (candidates) {
      setCandidates(candidates);
    }
  };

  return (
    <div>
      <div>
        <button onClick={generateGrid}>generate</button>
        <button onClick={forceUpdate}>update</button>
      </div>
      <div>
        {Array.apply(null, Array(ROWS)).map((_, rIndex) => {
          return Array.apply(null, Array(COLS)).map((_, cIndex) => {
            return (
              <div>
                {rIndex}, {cIndex},{" "}
                <input
                  value={data.grid[rIndex][cIndex].value}
                  onChange={(event) => {
                    handleValueChange(
                      rIndex,
                      cIndex,
                      event.target.value.toString()
                    );
                  }}
                />
              </div>
            );
          });
        })}
      </div>
    </div>
  );
};
