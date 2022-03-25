import * as React from "react";
import AddPuzzleScreen from "../AddPuzzleScreen";
import {Plus, Refresh, Reset} from "../Icons";

import styles from "./styles.module.scss";

const Controls = ({onRefresh, onReset, editorMode}) => {
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
