import { eStates } from "./utils";

const solverUrl = "http://10.0.0.3:8000/"

/*
# EXAMPLE DATA FORMAT FOR SOLVER
# puzzle taken from http://nikoli.com/swf/sl.swf?loadUrl=/nfp/sl-0001.nfp&lang=1
10 10

....02....
230....223
...3..3...
3...22...1
.2.2..0.2.
.2.3..3.3.
3...10...2
...2..3...
303....331
....02....

# EXAMPLE RESPONSE FORMAT FROM SOLVER
Puzzle: /ws/Others/slink-solver/input.txt
. - . - . x . x . x . x . - . x . x . x .
|   x   |   x   x 0 x 2 |   |   x   x   x
. x . - . x . x . x . - . x . - . x . - .
| 2 | 3 x 0 x   x   |   x   x 2 | 2 | 3 |
. x . - . x . - . x . x . - . x . x . x .
|   x   |   | 3 |   |   | 3 |   |   |   |
. - . x . - . x . - . x . x . x . - . x .
x 3 |   x   x   x 2 x 2 |   |   x   x 1 |
. - . x . - . - . - . - . x . - . - . x .
|   x 2 |   x 2 x   x   x 0 x   x 2 |   |
. - . - . x . - . x . - . x . - . x . x .
x   x 2 x   | 3 |   |   | 3 |   | 3 |   |
. - . - . - . x . - . x . - . x . - . x .
| 3 x   x   x   x 1 x 0 x   x   x   x 2 |
. - . x . - . - . x . x . - . - . - . - .
x   |   |   x 2 |   x   | 3 x   x   x   x
. - . x . - . x . - . x . - . x . - . x .
| 3 x 0 x 3 |   x   |   x   | 3 | 3 | 1 x
. - . x . - . x . x . - . x . - . x . x .
x   |   |   x   x 0 x 2 |   x   x   |   x
. x . - . x . x . x . x . - . - . - . x .
Solved
Total time:     0.053913 seconds
 */

export async function solve(w: number, h: number, numbers: Int8Array, mask: Int8Array): Promise<[Int8Array, Int8Array]> {
  const [eRows, eCols] = [w + 1, h + 1]

  // Format data: numbers, mask
  let req = `# Online Edit\n${w} ${h}\n\n`
  for (let i = 0; i < h; i++) {
    for (let j = 0; j < w; j++) {
      req += mask[i * w + j] ? '.' : numbers[i * w + j]
    }
    // IMPORTANT NOTE: The backend is very strict about trailing newlines, if a trailing newline exist,
    // it would return "invalid puzzle"
    if (i < h - 1) req += '\n'
  }

  // Send data to solver
  let response = await fetch(solverUrl, {
    method: "post",
    body: req
  })
  // Parse response
  let data = await response.json()
  console.log(data)

  let lines = data.split('\n').filter(x => x.length > 0)
  const [hStates, vStates] = [new Int8Array(eRows * eCols), new Int8Array(eRows * eCols)]
  let hLines = lines.filter(l => l[0] == '.')
  let vLines = lines.filter(l => l[0] == '|' || l[0] == 'x')
  console.log(hLines, vLines, lines)

  const dict: Record<string, number> = {
    '.': eStates.none,
    'x': eStates.autoCrossed,
    '|': eStates.selected,
    '-': eStates.selected
  }

  for (let x = 0; x < eRows; x++) {
    for (let y = 0; y < eCols; y++) {
      try {
        hStates[y * eCols + x] = dict[hLines[y][x * 4 + 2]]
      } catch (e) {}
      try {
        vStates[y * eCols + x] = dict[vLines[y][x * 4]]
      } catch (e) {}
    }
  }

  return [hStates, vStates]
}

