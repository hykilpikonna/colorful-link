import * as React from "react";
import {EDGE_STATE} from "../../constants";
import {areValid, findNeighbor, getNeighbors, multiStyles} from "../../utils";
import Controls from "../Controls";
import LineRow from "./components/LineRow";
import NumberRow from "./components/NumberRow";
import styles from "./styles.module.scss";

/*
  Grid traversal
    (0, 0) -- (0, 1) -- (0, 2) -->
      |         |       |
      |         |       |
    (1, 0) -- (1, 1) -- (1, 2) -->
      |         |       |
      |         |       |
    (2, 0) -- (2, 1) -- (2, 2) -->
      |         |       |
      |         |       |
      V         V       V
*/

export const DEFAULT_NODE = {neigh: [], n: -1};
/* 
  structure for neigh elements: 
    {state: <EDGE_STATE>, loc: [x, y]}
*/

const Grid = ({matrix, setMatrix, readOnly, editorMode, state, className}) => {
  const nHorLine = matrix?.length || 0;
  const nVerLine = matrix?.[0]?.length || 0;

  if (nHorLine === 0 || nVerLine === 0) {
    return null;
  }

  const updateMatrix = (dataArray) => {
    let temp = matrix.slice();
    dataArray.forEach(({node: [x, y], data}) => {
      temp[x][y] = {...temp[x][y], ...data};
    });
    setMatrix(temp);
  };

  const onLineClick = (x, y, direction, click) => {
    if (readOnly) {
      return;
    }

    const isMiddleClick = click === "middle";
    const node = [x, y];
    const otherNode = direction === "horizontal" ? [x, y + 1] : [x + 1, y];
    let nodeUpdateData = {};
    let otherNodeUpdateData = {};
    const neighborIndex = findNeighbor(node, otherNode, matrix);
    const otherNeighborIndex = findNeighbor(otherNode, node, matrix);

    // if there was already an edge (ACTIVE | NOT_ALLOWED)
    if (neighborIndex !== -1) {
      // if the edge was NOT_ALLOWED
      const isNewEdgeStateEmpty =
        matrix[x][y].neigh[neighborIndex].state === EDGE_STATE.NOT_ALLOWED;
      let newNeighbors = getNeighbors(node, matrix).slice();
      newNeighbors.splice(neighborIndex, 1);
      nodeUpdateData = {
        neigh: [
          ...newNeighbors,
          ...(isNewEdgeStateEmpty || isMiddleClick
            ? []
            : [{state: EDGE_STATE.NOT_ALLOWED, loc: otherNode}]),
        ],
      };
      let newOtherNeighbors = getNeighbors(otherNode, matrix).slice();
      newOtherNeighbors.splice(otherNeighborIndex, 1);
      otherNodeUpdateData = {
        neigh: [
          ...newOtherNeighbors,
          ...(isNewEdgeStateEmpty || isMiddleClick
            ? []
            : [{state: EDGE_STATE.NOT_ALLOWED, loc: node}]),
        ],
      };
    } else if (!isMiddleClick) {
      nodeUpdateData = {
        neigh: [
          ...matrix[x][y].neigh,
          {
            state:
              click === "left" ? EDGE_STATE.ACTIVE : EDGE_STATE.NOT_ALLOWED,
            loc: otherNode,
          },
        ],
      };
      otherNodeUpdateData = {
        neigh: [
          ...matrix[otherNode[0]][otherNode[1]].neigh,
          {
            state:
              click === "left" ? EDGE_STATE.ACTIVE : EDGE_STATE.NOT_ALLOWED,
            loc: node,
          },
        ],
      };
    }
    updateMatrix([
      {node, data: nodeUpdateData},
      {node: otherNode, data: otherNodeUpdateData},
    ]);
  };

  const onLineLeftClick = (x, y, direction) =>
    onLineClick(x, y, direction, "left");
  const onLineRightClick = (x, y, direction) =>
    onLineClick(x, y, direction, "right");
  const onLineMiddleClick = (x, y, direction) =>
    onLineClick(x, y, direction, "middle");

  const onNumberChange = (x, y, num) => {
    if (!editorMode || readOnly) {
      return;
    }
    updateMatrix([{node: [x, y], data: {n: num}}]);
  };

  return (
    <div
      className={multiStyles(styles, [
        "canvas",
        className,
        state,
        readOnly && "readOnly",
      ])}
      // disabling right click on grid
      onContextMenu={(e) => e.preventDefault()}
    >
      {Array(nHorLine - 1)
        .fill(0)
        .map((_, i) => {
          return [
            <LineRow
              matX={i}
              mat={matrix}
              n={nVerLine}
              onLineClick={onLineLeftClick}
              onLineRightClick={onLineRightClick}
              onLineMiddleClick={onLineMiddleClick}
              key={`line_row_${i}`}
            />,
            <NumberRow
              matX={i}
              mat={matrix}
              n={nVerLine}
              onLineClick={onLineLeftClick}
              onLineRightClick={onLineRightClick}
              onLineMiddleClick={onLineMiddleClick}
              onNumberChange={onNumberChange}
              editorMode={editorMode}
              key={`number_row_${i}`}
            />,
          ];
        })
        .concat([
          <LineRow
            matX={nHorLine - 1}
            mat={matrix}
            n={nVerLine}
            onLineClick={onLineLeftClick}
            onLineRightClick={onLineRightClick}
            onLineMiddleClick={onLineMiddleClick}
            key={`line_row_${nHorLine - 1}`}
          />,
        ])}
    </div>
  );
};

export default Grid;
