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
