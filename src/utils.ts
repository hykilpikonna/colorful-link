
export const cfg = {
  cellW: 20,
  lineW: 4,
  totalW: 24
}

export const eStates = {
  none: 0,
  selected: 1,
  crossed: 2,
  autoCrossed: 5
}

export const nStates = {
  none: 0,
  error: 1,
  complete: 2
}

export function sty(styles: any) {
  return Object.entries(styles)
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
}

export function pos(x: number, y: number) {
  return `top:${y}px;left:${x}px;`;
}

export function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function range(n: number) {
  return Array.from({length: n}, (_, i) => i);
}
