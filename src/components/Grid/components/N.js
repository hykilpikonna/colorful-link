import {multiStyles} from "../../../utils";
import styles from "../styles.module.scss";

const N = ({className, value, setNum, editorMode, ...props}) => {
    const v = value >= 0 && !isNaN(value) ? value : ""

    return (<span className={multiStyles(styles, ["number", className])} {...props}>
        {editorMode && <input
            disabled
            onChange={(e) => setNum(parseInt(e.target.value))}
            value={v}
        /> || v}
    </span>)
}

export default N
