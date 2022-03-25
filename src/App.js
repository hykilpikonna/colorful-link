import * as React from "react";

import styles from "./App.styles.module.scss";
import CheckSolution from "./components/CheckSolution";
import Grid from "./components/Grid";
import Info from "./components/Info";
import {examples} from "./examples";

const App = () => {
  const [matrix, setMatirx] = React.useState([]);
  const [{dim, numbers, solution}] = React.useState(
    examples[Math.floor(Math.random() * examples.length)]
  );
  const [check, setCheck] = React.useState("none");

  return (
    <main>
      <h1 className={styles.heading}>
        <span>Slither</span>
        <span>Link</span>
      </h1>
      <Grid
        dim={dim}
        numbers={numbers}
        matrix={matrix}
        updateMatrix={setMatirx}
        check={check}
      />
      <Info />
      <CheckSolution matrix={matrix} solution={solution} setCheck={setCheck} />
    </main>
  );
};

export default App;
