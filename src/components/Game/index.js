import * as React from "react";
import {examples} from "../../examples";
import {getMatrix} from "../../utils";
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
  const [check, setCheck] = React.useState("none");

  // initializing matrix with example
  React.useEffect(() => {
    if (dim.length) {
      setMatrix(getMatrix(dim, [], numbers));
    }
  }, [dim.length]);

  const onReset = () => {
    if (dim.length) {
      setMatrix(getMatrix(dim, [], numbers));
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
      <Grid matrix={matrix} setMatrix={setMatrix} state={check} />
      <Info />
      <CheckSolution matrix={matrix} solution={solution} setCheck={setCheck} />
      <Controls onReset={onReset} onRefresh={onRefresh} />
    </main>
  );
};

export default Game;
