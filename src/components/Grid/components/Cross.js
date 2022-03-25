import * as React from "react";
import {multiStyles} from "../../../utils";
import styles from "../styles.module.scss";

const Cross = ({
  orientation = "h",
  className,
  onRightClick,
  onMiddleClick,
  ...props
}) => {
  return (
    <div
      className={multiStyles(styles, [
        "line",
        "cross",
        orientation === "v" ? "vertical" : "horizontal",
        className,
      ])}
      {...props}
      onContextMenu={(e) => {
        e.preventDefault();
        onRightClick();
      }}
      onMouseDown={(e) => {
        if (e.button === 1) {
          onMiddleClick();
        }
      }}
    >
      <span />
      <span />
    </div>
  );
};

export default Cross;
