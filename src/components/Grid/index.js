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

const DEFAULT_NODE = {neigh: [], n: -1};
/* 
  structure for neigh elements: 
    {state: <EDGE_STATE>, loc: [x, y]}
*/

const Grid = ({
  dim = [3, 3],
  edges = [],
  numbers = [],
  matrix: propMatrix = [],
  updateMatrix: updatePropMatrix = () => {},
  readOnly,
  onReset: propOnReset,
  editorMode,
  check,
  className,
}) => {
  const nRows = dim[0];
  const nCols = dim[1];
  const nHorLine = nRows + 1;
  const nVerLine = nCols + 1;
  const [matrix, setMatrix] = React.useState([]);

  const setPropMatrix = (matrix) => {
    if (Array.isArray(propMatrix)) {
      updatePropMatrix(matrix);
    }
  };

  // initializing matrix with prop edges and numbers
  React.useEffect(() => {
    let temp = new Array(nHorLine)
      .fill(0)
      .map(() => new Array(nVerLine).fill(DEFAULT_NODE));
    numbers.forEach(({r, c, n}) => {
      if (r <= nRows && c <= nCols) {
        temp[r - 1][c - 1] = {...temp[r - 1][c - 1], n};
      }
    });
    edges.forEach(({a: [sx, sy], b: [ex, ey], notAllowed, hovered}) => {
      const edgeState = notAllowed
        ? EDGE_STATE.NOT_ALLOWED
        : hovered
        ? EDGE_STATE.HOVERED
        : EDGE_STATE.ACTIVE;
      let startX, startY, endX, endY, hor, ver;
      hor = sx === ex;
      ver = sy === ey;

      // excluding cases where both points are same
      // or where edge is not hor | ver
      // Assumption: all edges are between two adjacent nodes
      if ((hor && ver) || (!hor && !ver)) {
        return;
      }

      // horizonal line
      if (hor) {
        startX = endX = sx;
        if (sy > ey) {
          startY = ey;
          endY = sy;
        }
        if (sy < ey) {
          startY = sy;
          endY = ey;
        }
      }
      // vertical line
      if (ver) {
        startY = endY = sy;
        if (sx > ex) {
          startX = ex;
          endX = sx;
        }
        if (sx < ex) {
          startX = sx;
          endX = ex;
        }
      }

      // check if all nodes are valid nodes
      if (areValid([startX, endX], nRows) && areValid([startY, endY], nCols)) {
        temp[startX][startY] = {
          ...temp[startX][startY],
          neigh: [
            ...temp[startX][startY].neigh,
            {state: edgeState, loc: [endX, endY]},
          ],
        };
        temp[endX][endY] = {
          ...temp[endX][endY],
          neigh: [
            ...temp[endX][endY].neigh,
            {state: edgeState, loc: [startX, startY]},
          ],
        };
      }
    });

    setMatrix(temp);
    setPropMatrix(temp);
  }, []);

  const updateMatrix = (dataArray) => {
    let temp = matrix.slice();
    dataArray.forEach(({node: [x, y], data}) => {
      temp[x][y] = {...temp[x][y], ...data};
    });
    setMatrix(temp);
    setPropMatrix(temp);
  };

  const onLineClick = (x, y, direction, click) => {
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
    updateMatrix([{node: [x, y], data: {n: num}}]);
  };

  const onReset = () => {
    let temp = new Array(nHorLine)
      .fill(0)
      .map(() => new Array(nVerLine).fill(DEFAULT_NODE));
    numbers.forEach(({r, c, n}) => {
      if (r <= nRows && c <= nCols) {
        temp[r - 1][c - 1] = {...temp[r - 1][c - 1], n};
      }
    });
    if (editorMode) {
      propOnReset();
    }
    setMatrix(temp);
    setPropMatrix(temp);
  };

  const onRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      {matrix.length > 0 && (
        <div
          className={multiStyles(styles, [
            "canvas",
            className,
            check,
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
      )}
      {!readOnly && (
        <Controls
          onReset={onReset}
          onRefresh={onRefresh}
          editorMode={editorMode}
        />
      )}
    </>
  );
};

export default Grid;
