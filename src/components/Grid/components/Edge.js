import * as React from "react";
import Cross from "./Cross";
import Line from "./Line";

const Edge = ({notAllowed, ...props}) => {
  return notAllowed ? <Cross {...props} /> : <Line {...props} />;
};

export default Edge;
