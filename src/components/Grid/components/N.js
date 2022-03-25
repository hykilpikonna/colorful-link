import * as React from "react";
import {multiStyles} from "../../../utils";
import styles from "../styles.module.scss";

const N = ({className, value, setNum, editorMode, ...props}) => {
  return (
    <span className={multiStyles(styles, ["number", className])} {...props}>
      <input
        readOnly={!editorMode}
        onChange={(e) => setNum(parseInt(e.target.value))}
        value={value >= 0 && !isNaN(value) ? value : undefined}
      />
    </span>
  );
};

export default N;
