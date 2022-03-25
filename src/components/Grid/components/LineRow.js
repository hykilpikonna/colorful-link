import * as React from "react";
import {EDGE_STATE} from "../../../constants";
import {findNeighbor, isNodeActive} from "../../../utils";
import Edge from "./Edge";
import Node from "./Node";
import Row from "./Row";

const LineRow = ({
  matX,
  mat = [],
  n = 1,
  onLineClick,
  onLineRightClick,
  onLineMiddleClick,
}) => {
  return (
    <Row>
      {mat.length &&
        Array(n - 1)
          .fill(0)
          .map((_, i) => {
            const edgeIdx = findNeighbor([matX, i], [matX, i + 1], mat);
            const showEdge = edgeIdx !== -1;
            return [
              <Node
                key={`node_${matX + i}`}
                active={isNodeActive(mat[matX][i])}
              />,
              <Edge
                notAllowed={
                  showEdge &&
                  mat[matX][i].neigh[edgeIdx].state === EDGE_STATE.NOT_ALLOWED
                }
                active={showEdge ? 1 : 0}
                onClick={() => onLineClick(matX, i, "horizontal")}
                onRightClick={() => onLineRightClick(matX, i, "horizontal")}
                onMiddleClick={() => onLineMiddleClick(matX, i, "horizontal")}
                hovered={
                  showEdge &&
                  mat[matX][i].neigh[edgeIdx].state === EDGE_STATE.HOVERED
                    ? 1
                    : 0
                }
                key={`edge_${matX + i}`}
              />,
            ];
          })
          .concat([
            <Node
              key={`node_${matX + n - 1}`}
              active={isNodeActive(mat[matX][n - 1]) ? 1 : 0}
            />,
          ])}
    </Row>
  );
};

export default LineRow;
