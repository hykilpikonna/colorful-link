
export type i8s = Int8Array
export interface Checkpoint { rows: number, cols: number,
  hStates: i8s, vStates: i8s, hColors: i8s, vColors: i8s, numbers: i8s, nMask: i8s, colors: string[] }

export const cfg = {
  cellW: 20,
  lineW: 4,
  totalW: 24,
  backend: "https://slither0.hydev.org",
}

export const eStates = {
  none: 0,
  selected: 1,
  crossed: 2,
  selectedError: 4,
  autoCrossed: 5
}

export const nStates = {
  none: 0,
  error: 1,
  complete: 2
}

export const sty = (styles: any) => Object.entries(styles).map(([k, v]) => `${k}:${v}`).join(';')
export const pos = (x: number, y: number) => `top:${y}px;left:${x}px;`
export const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
export const range = (n: number) => Array.from({length: n}, (_, i) => i)
export const zero8 = (n: number) => new Int8Array(n).fill(0)

// Json with TypedArray serialization
export const JsonTy = {
  stringify: (obj: any) => JSON.stringify(obj, (_, v) => {
    if (ArrayBuffer.isView(v)) {
      // @ts-ignore Check if it's a TypedArray and serialize it
      return { __typedArray__: true, type: v.constructor.name, data: Array.from(v) };
    }
    return v; // For all other data types, keep it as is
  }),

  parse: (json: string) => JSON.parse(json, (_, v) => {
    if (v && v.__typedArray__) {
      // @ts-ignore Deserialize the TypedArray
      return new globalThis[v.type](v.data);
    }
    return v; // For all other data types, keep it as is
  }),

  download: (obj: any, name: string) => {
    const blob = new Blob([JsonTy.stringify(obj)], {type: 'application/json'})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
    URL.revokeObjectURL(a.href)
  }
}

export const Fmt = {
  duration: (ms: number) => {
    let d = 0, h = 0, m = 0, s = 0;
    [s, ms] = [Math.floor(ms / 1000), ms % 1000];
    [m, s] = [Math.floor(s / 60), s % 60];
    [h, m] = [Math.floor(m / 60), m % 60];
    [d, h] = [Math.floor(h / 24), h % 24];
    
    return `${d ? `${d}d ` : ''}${h ? `${h}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
}

export const Backend = {
  get: (id: string) => fetch(`${cfg.backend}/${id}`).then(r => {
    if (!r.ok) throw new Error(`Failed to get puzzle: ${r.status}`)
    return r.text()
  }).then(JsonTy.parse),
  post: (data: Checkpoint) => fetch(`${cfg.backend}/`, { method: "post", body: JsonTy.stringify(data) }),
}

export const Misc = {
  // @ts-ignore
  hasTouch: () => 'ontouchstart' in document.documentElement || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0
}
