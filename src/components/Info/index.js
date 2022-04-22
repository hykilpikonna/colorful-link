import * as React from "react";
import {
  EXAMPLE_GRID_PROPS,
  NOT_ALLOWED_1_GRID_PROPS,
  NOT_ALLOWED_2_GRID_PROPS,
} from "../../constants";
import {getMatrix} from "../../utils";
import Grid from "../Grid";

import styles from "./styles.module.scss";

const Info = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div className={styles.container} onClick={() => setOpen(true)}>
        <div className={styles.button}>i</div>
        <span>Info</span>
      </div>
      {open && (
        <div className={styles.info}>
          <span className={styles.cross} onClick={() => setOpen(false)} />

          <section className={styles.rules}>
            <div className={styles.title}>Rules</div>
            <div className={styles.item}>
              Connect adjacent dots with vertical or horizontal lines, creating
              a single loop.
              <div className={styles.eg}>
                <Grid
                  matrix={getMatrix(
                    EXAMPLE_GRID_PROPS.dim,
                    EXAMPLE_GRID_PROPS.edges,
                    EXAMPLE_GRID_PROPS.numbers
                  )}
                  readOnly
                />
              </div>
            </div>
            <div className={styles.item}>
              Crossovers or branches are not allowed (as shown by dotted lines
              below).
              <div className={styles.eg}>
                <Grid
                  matrix={getMatrix(
                    NOT_ALLOWED_1_GRID_PROPS.dim,
                    NOT_ALLOWED_1_GRID_PROPS.edges,
                    NOT_ALLOWED_1_GRID_PROPS.numbers
                  )}
                  readOnly
                />
                <Grid
                  matrix={getMatrix(
                    NOT_ALLOWED_2_GRID_PROPS.dim,
                    NOT_ALLOWED_2_GRID_PROPS.edges,
                    NOT_ALLOWED_2_GRID_PROPS.numbers
                  )}
                  readOnly
                />
              </div>
            </div>
            <div className={styles.item}>
              Numbers in the puzzle indicate the number of lines that should
              surround it.
            </div>
            <div className={styles.item}>
              You can't draw lines around zeroes.
            </div>
            <div className={styles.item}>
              Each puzzle has just one uniques solution.
            </div>
          </section>
          <section className={styles.howToBegin}>
            <div className={styles.title}>How to begin</div>
            <div className={styles.item}>
              Begin with the zero next to 3. If no such case is present, then
              use one of the rules in the{" "}
              <a
                style={{display: "contents"}}
                rel='noreferrer'
                href='https://en.wikipedia.org/wiki/Slitherlink'
                target='_blank'
              >
                wikipedia link
              </a>{" "}
              to start off.
            </div>
            <div className={styles.item}>
              Since no lines can be drawn around zero, mark crosses around it as
              shown.
            </div>
            <div className={styles.item}>
              Now there's a cross in one space around 3. So we know the three
              lines of 3 can only be drawn in the remaining three spaces.
            </div>
            <div className={styles.item}>
              Next, these lines can only be extended in one direction each.
            </div>
            <div className={styles.item}>Continue using the same logic.</div>
          </section>
          <section className={styles.hint}>
            <div className={styles.title}>Hints</div>
            <span>
              Keep eliminating possibilities by marking crosses in spaces
              between dots where a line isn't possible, i.e., if you have
              already completed required lines or where a line creation may
              create a branch or a deadend. Visit the{" "}
              <a
                rel='noreferrer'
                href='https://en.wikipedia.org/wiki/Slitherlink'
                target='_blank'
              >
                wikipedia link
              </a>{" "}
              for more hints.
            </span>
          </section>
          <section className={styles.controls}>
            <div className={styles.title}>Controls</div>
            <table>
              <tbody>
                <tr>
                  <td>
                    <b>Left Mouse Button</b>
                  </td>
                  <td>Toggle line</td>
                </tr>
                <tr>
                  <td>
                    <b>Right Mouse Button</b>
                  </td>
                  <td>Mark line as crossed/not allowed</td>
                </tr>
                <tr>
                  <td>
                    <b>Middle Mouse Button</b>
                  </td>
                  <td>Reset line state</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      )}
    </>
  );
};

export default Info;
