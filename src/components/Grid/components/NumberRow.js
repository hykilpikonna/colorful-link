import {EDGE_STATE} from "../../../constants";
import {findNeighbor} from "../../../utils";
import Edge from "./Edge";
import N from "./N";
import Row from "./Row";

const NumberRow = ({
  matX,
  mat = [],
  n = 1,
  onLineClick,
  onLineRightClick,
  onLineMiddleClick,
  onNumberChange,
  editorMode,
}) => {
  const endEdgeIdx =
    mat.length && findNeighbor([matX, n - 1], [matX + 1, n - 1], mat);
  const showEndEdge = endEdgeIdx !== -1;
  return (
    <Row>
      {mat.length &&
        Array(n - 1)
          .fill(0)
          .map((_, i) => {
            const edgeIdx = findNeighbor([matX, i], [matX + 1, i], mat);
            const showEdge = edgeIdx !== -1;
            return [
              <Edge
                notAllowed={
                  showEdge &&
                  mat[matX][i].neigh[edgeIdx].state === EDGE_STATE.NOT_ALLOWED
                }
                orientation='v'
                active={showEdge ? 1 : 0}
                onClick={() => onLineClick(matX, i, "vertical")}
                onRightClick={() => onLineRightClick(matX, i, "vertical")}
                onMiddleClick={() => onLineMiddleClick(matX, i, "vertical")}
                hovered={
                  showEdge &&
                  mat[matX][i].neigh[edgeIdx].state === EDGE_STATE.HOVERED
                    ? 1
                    : 0
                }
                key={`edge_${matX + i}`}
              />,
              <N
                value={mat[matX][i].n}
                setNum={(n) => onNumberChange(matX, i, n)}
                editorMode={editorMode}
                key={`number_${matX + i}`}
              />,
            ];
          })
          .concat([
            <Edge
              notAllowed={
                showEndEdge &&
                mat[matX][n - 1].neigh[endEdgeIdx].state ===
                  EDGE_STATE.NOT_ALLOWED
              }
              orientation='v'
              active={showEndEdge ? 1 : 0}
              onClick={() => onLineClick(matX, n - 1, "vertical")}
              onRightClick={() => onLineRightClick(matX, n - 1, "vertical")}
              onMiddleClick={() => onLineMiddleClick(matX, n - 1, "vertical")}
              hovered={
                showEndEdge &&
                mat[matX][n - 1].neigh[endEdgeIdx].state === EDGE_STATE.HOVERED
                  ? 1
                  : 0
              }
              key={`edge_${matX + n - 1}`}
            />,
          ])}
    </Row>
  );
};

export default NumberRow;
