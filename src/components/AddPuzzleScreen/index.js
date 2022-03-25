import * as React from "react";
import {getNumbers, multiStyles} from "../../utils";
import Grid from "../Grid";
import N from "../Grid/components/N";

import styles from "./styles.module.scss";

const AddPuzzleScreen = ({open, onClose}) => {
  const [dim, setDim] = React.useState([3, 3]);
  const [gridMat, setGridMat] = React.useState([]);

  const [gridNumbers, setGridNumbers] = React.useState([]);
  React.useEffect(() => {
    setGridNumbers(getNumbers(gridMat));
  }, [JSON.stringify(gridMat)]);

  const [gridReset, setGridReset] = React.useState(false);
  React.useEffect(() => {
    if (gridReset) {
      setGridReset(false);
    }
  }, [gridReset]);

  const [submitState, setSubmitState] = React.useState("none");
  const [submitText, setSubmitText] = React.useState("Submit");
  const onSubmit = () => {
    setSubmitState("passed");
    setSubmitText("Thanks for submitting! 😀");
  };
  React.useEffect(() => {
    let timeout;
    if (submitState === "passed") {
      timeout = setTimeout(() => {
        setSubmitState("none");
        setSubmitText("Submit");
      }, 5000);
    }

    return () => !isNaN(timeout) && clearTimeout(timeout);
  }, [submitState]);

  const shouldShowGrid =
    !isNaN(dim[0]) && dim[0] > 0 && !isNaN(dim[1]) && dim[1] > 0 && !gridReset;

  return (
    <>
      {open && (
        <div className={styles.screen}>
          <span className={styles.cross} onClick={onClose} />

          <section className={styles.dimension}>
            <div className={styles.title}>Set dimensions</div>
            <div className={styles.content}>
              <div className={styles.dimInputWrapper}>
                <N
                  value={dim[0]}
                  setNum={(n) => {
                    setGridReset(true);
                    setDim([n, dim[1]]);
                  }}
                  editorMode
                  className={styles.input}
                />
                X
                <N
                  value={dim[1]}
                  setNum={(n) => {
                    setGridReset(true);
                    setDim([dim[0], n]);
                  }}
                  editorMode
                  className={styles.input}
                />
              </div>
            </div>
          </section>
          <section className={styles.matrix}>
            <div className={styles.title}>Set matrix</div>
            <div className={styles.content}>
              <div className={styles.matrixGrid}>
                {shouldShowGrid ? (
                  <Grid
                    dim={dim}
                    matrix={gridMat}
                    updateMatrix={setGridMat}
                    numbers={gridNumbers}
                    onReset={() => {
                      setGridNumbers([]);
                      setGridReset(true);
                    }}
                    editorMode
                  />
                ) : (
                  "Please set valid dimensions above"
                )}
              </div>
            </div>
            <div className={styles.content}>
              <a
                href={`mailto:amey23399@gmail.com?subject=Slither Link Example&body=${JSON.stringify(
                  gridNumbers
                )}`}
                className={multiStyles(styles, ["submitButton", submitState])}
                onClick={onSubmit}
              >
                {submitText}
              </a>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default AddPuzzleScreen;
