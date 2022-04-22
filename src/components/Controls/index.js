import * as React from "react";
import AddPuzzleScreen from "../AddPuzzleScreen";
import {Plus, Redo, Refresh, Reset, Undo} from "../Icons";

import styles from "./styles.module.scss";

const Controls = ({onRefresh, onReset, onUndo, onRedo, editorMode}) => {
  const [showAddScreen, setShowAddScreen] = React.useState(false);

  return (
    <>
      <div className={styles.controls}>
        {!editorMode && (
          <div className={styles.refresh} onClick={onRefresh}>
            <Refresh />
            <span>Refresh</span>
          </div>
        )}
        <div className={styles.reset} onClick={onReset}>
          <Reset />
          <span>Reset</span>
        </div>
        <div className={styles.undo} onClick={onUndo}>
          <Undo />
          <span>Undo</span>
        </div>
        <div className={styles.redo} onClick={onRedo}>
          <Redo />
          <span>Redo</span>
        </div>
        {!editorMode && (
          <div className={styles.add} onClick={() => setShowAddScreen(true)}>
            <Plus />
            <span>Add</span>
          </div>
        )}
      </div>
      <AddPuzzleScreen
        open={showAddScreen}
        onClose={() => setShowAddScreen(false)}
      />
    </>
  );
};

export default Controls;
