import {multiStyles} from "../../../utils";
import styles from "../styles.module.scss";

const Node = ({className, active, ...props}) => {
  return (
    <div
      className={multiStyles(styles, ["node", className, active && "active"])}
      {...props}
    />
  );
};

export default Node;
