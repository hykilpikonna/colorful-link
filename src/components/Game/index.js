import * as React from "react";
import {examples} from "../../examples";
import {copy, getEdges, getMatrix} from "../../utils";
import CheckSolution from "../CheckSolution";
import Controls from "../Controls";
import Grid from "../Grid";
import Info from "../Info";

import styles from "./styles.module.scss";

const Game = () => {
  const [matrix, setMatrix] = React.useState([]);
  const [{dim = [], numbers, solution}] = React.useState(
    examples[Math.floor(Math.random() * examples.length)]
  );

  const [history, setHistory] = React.useState([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);

  const [check, setCheck] = React.useState("none");

  const updateMatrix = (matrix) => {
    setHistory([...history.slice(0, historyIndex + 1), copy(matrix)]);
    setHistoryIndex(historyIndex + 1);
    setMatrix(matrix);
  };

  // initializing matrix with example
  React.useEffect(() => {
    if (dim.length) {
      let temp = getMatrix(dim, [], numbers);
      updateMatrix(temp);
    }
  }, [dim.length]);

  const onUndo = () => {
    // check if undo is possible
    if (historyIndex < 1) {
      return;
    }

    // performing undo
    setMatrix(copy(history[historyIndex - 1]));
    setHistoryIndex(historyIndex - 1);
  };

  const onRedo = () => {
    // check if redo is possible
    if (historyIndex + 1 === history.length) {
      return;
    }

    // performing undo
    setMatrix(copy(history[historyIndex + 1]));
    setHistoryIndex(historyIndex + 1);
  };

  const onReset = () => {
    if (dim.length) {
      // if matrix already empty
      if (getEdges(matrix).length === 0) {
        return;
      }
      updateMatrix(getMatrix(dim, [], numbers));
    }
  };

  const onRefresh = () => {
    window.location.reload();
  };

  return (
    <main>
      <h1 className={styles.heading}>
        <span>Slither</span>
        <span>Link</span>
      </h1>
      <Grid matrix={matrix} setMatrix={updateMatrix} state={check} />
      <Info />
      <CheckSolution matrix={matrix} solution={solution} setCheck={setCheck} />
      <Controls
        onReset={onReset}
        onRefresh={onRefresh}
        onUndo={onUndo}
        onRedo={onRedo}
      />
    </main>
  );
};

export default Game;
