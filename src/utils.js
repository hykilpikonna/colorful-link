import {DEFAULT_NODE} from "./components/Grid";
import {EDGE_STATE} from "./constants";

// to get multiple styles in space-seperated format
export const multiStyles = (styles, classNames) =>
  classNames
    .reduce(
      (classNames, className) => [
        ...classNames,
        ...(!className ? [] : [styles?.[className] || className]),
      ],
      []
    )
    .join(" ");

// to check if number is valid number
export const isValid = (n, lim) => n >= 0 && n <= lim;

// to check all elements are valid numbers
export const areValid = (n, lim) => n.every((n) => isValid(n, lim));

export const getMatrix = ([dim1, dim2], edges = [], numbers = []) => {
  const nRows = dim1;
  const nCols = dim2;

  let temp = new Array(dim1 + 1)
    .fill(0)
    .map(() => new Array(dim2 + 1).fill(DEFAULT_NODE));

  if (numbers.length > 0) {
    numbers.forEach(({r, c, n}) => {
      if (r <= nRows && c <= nCols) {
        temp[r - 1][c - 1] = {...temp[r - 1][c - 1], n};
      }
    });
  }

  if (edges.length > 0) {
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
  }

  return temp;
};

// to check if a node has an active edge
export const isNodeActive = (n) =>
  Array.isArray(n?.neigh) &&
  n.neigh.some((neighbor) => neighbor.state === EDGE_STATE.ACTIVE);

// to get neighbors from matrix
export const getNeighbors = ([ax, ay], mat) => {
  return mat[ax][ay]?.neigh || [];
};

// to check if two nodes are neighbor in a matrix
export const findNeighbor = ([ax, ay], [bx, by], mat) => {
  const index = mat?.[ax]?.[ay]?.neigh.findIndex(
    ({loc}) => loc[0] === bx && loc[1] === by
  );
  return isNaN(index) ? -1 : index;
};

// get an array of all numbers present in the matrix
export const getNumbers = (mat) => {
  let numbers = [];
  let nRow = mat?.length;
  let nCol = mat?.[0]?.length;
  if (!nRow || !nCol) {
    return;
  }

  mat.forEach((row, r) => {
    if (r >= nRow - 1) return;
    row.forEach((node, c) => {
      if (c >= nCol - 1) return;
      numbers = [
        ...numbers,
        ...(node.n > -1 ? [{r: r + 1, c: c + 1, n: node.n}] : []),
      ];
    });
  });
  return numbers;
};

// get an array of all edges present in the matrix
export const getEdges = (mat) => {
  let edges = [];
  mat.forEach((row, sX) => {
    row.forEach((node, sY) => {
      let horEdges = [];
      let verEdges = [];
      node.neigh.forEach((edge) => {
        const [eX, eY] = edge.loc;
        if (eX > sX && eY === sY) {
          verEdges = [
            ...verEdges,
            {
              a: [sX, sY],
              b: [eX, eY],
              ...(edge?.state === EDGE_STATE.NOT_ALLOWED
                ? {notAllowed: true}
                : {}),
              ...(edge?.state === EDGE_STATE.HOVERED ? {hovered: true} : {}),
            },
          ];
        } else if (eY > sY && eX === sX) {
          horEdges = [
            ...horEdges,
            {
              a: [sX, sY],
              b: [eX, eY],
              ...(edge?.state === EDGE_STATE.NOT_ALLOWED
                ? {notAllowed: true}
                : {}),
              ...(edge?.state === EDGE_STATE.HOVERED ? {hovered: true} : {}),
            },
          ];
        }
      });
      edges = [...edges, ...horEdges, ...verEdges];
    });
  });
  return edges;
};

// get an array of all active edges present in the matrix
export const getActiveEdges = (mat) => {
  return getEdges(mat).filter((edge) => !edge?.notAllowed && !edge?.hovered);
};
