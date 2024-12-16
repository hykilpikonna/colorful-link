import {multiStyles} from "../../../utils";
import styles from "../styles.module.scss";

const Line = ({
  orientation = "h",
  hovered,
  active,
  className,
  onRightClick,
  onMiddleClick,
  ...props
}) => {
  return (
    <div
      className={multiStyles(styles, [
        "line",
        orientation === "v" ? "vertical" : "horizontal",
        hovered ? "hovered" : active && "active",
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
    />
  );
};

export default Line;
