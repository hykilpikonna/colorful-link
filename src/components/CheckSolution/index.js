import * as React from "react";
import {getActiveEdges, multiStyles} from "../../utils";

import styles from "./styles.module.scss";

const CheckSolution = ({matrix, solution, setCheck}) => {
  const [text, setText] = React.useState("Check Solution");
  const [state, setState] = React.useState("none");

  React.useEffect(() => {
    let timeout;
    if (state !== "none") {
      timeout = setTimeout(() => {
        setState("none");
        setCheck("none");
        setText("Check Solution");
      }, 4000);
    }

    return () => !isNaN(timeout) && clearTimeout(timeout);
  }, [state]);
  return (
    <div
      className={multiStyles(styles, ["button", state])}
      onClick={() => {
        let check =
          JSON.stringify(getActiveEdges(matrix)) === JSON.stringify(solution);
        if (check) {
          setText("That is correct! 😀");
          setState("passed");
          setCheck("passed");
        } else {
          setText("Wrong Solution 😔");
          setState("failed");
          setCheck("failed");
        }
      }}
    >
      {text}
    </div>
  );
};

export default CheckSolution;
