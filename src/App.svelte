<script lang="ts">
  import svelteLogo from './assets/svelte.svg'
  import viteLogo from '/vite.svg'
  import Number from './lib/Number.svelte'
  import { cfg, eStates, Fmt, JsonTy, nStates, randInt, range, zero8 } from "./utils";
  import Line from "./lib/Line.svelte";
  import { solve } from "./solver";

  type i8s = Int8Array
  const params = new URLSearchParams(location.search)

  // Main variables
  const [rows, cols] = [40, 40]
  const [eRows, eCols] = [rows + 1, cols + 1]
  let [numbers, nMask, numberState] = [zero8(rows * cols), zero8(rows * cols).fill(1), zero8(rows * cols)]
  let [hStates, vStates] = [zero8(eRows * eCols), zero8(eRows * eCols)]
  let [solutionHStates, solutionVStates] = [zero8(eRows * eCols), zero8(eRows * eCols)]

  // Colors
  let [hColors, vColors, colors, css, ci] = [zero8(eRows * eCols), zero8(eRows * eCols), ["#90A4AE"], document.createElement('style'), 0]
  document.head.appendChild(css)
  const updateColors = () => css.innerHTML = colors.map((c, i) => `.grid-line.c${i} { --c: ${c} }`).join('\n')
  updateColors()

  // Editing controls
  let grid: HTMLDivElement
  let [editMode, dragging] = [params.has('edit'), false]
  const modes = ['line', 'mask', 'color']
  let mode = 'line'
  let [startTime, elapsed, complete, statusMsg] = [Date.now(), 0, false, '']
  setInterval(() => !complete && (elapsed = Date.now() - startTime), 100)

  // Checkpoints
  interface Checkpoint { hStates: i8s, vStates: i8s, hColors: i8s, vColors: i8s, numbers: i8s, nMask: i8s, colors: string[] }
  const ckpt = () => ({hStates, vStates, numbers, nMask, hColors, vColors, colors})
  const loadPt = () => JsonTy.parse(localStorage.getItem('slitherlink-checkpoints') ?? "[]")
  let ckpts: Checkpoint[] = loadPt()
  const savePt = (fn: () => any) => () => { fn()
    localStorage.setItem('slitherlink-checkpoints', JsonTy.stringify(ckpts))
    ckpts = loadPt()
  }
  const restorePt = (pt: Checkpoint) => {
    pt.hStates.forEach((st, idx) => hStates[idx] = st)
    pt.vStates.forEach((st, idx) => vStates[idx] = st)
    pt.numbers.forEach((n, idx) => numbers[idx] = n)
    pt.nMask.forEach((n, idx) => nMask[idx] = n)
    pt.hColors.forEach((n, idx) => hColors[idx] = n)
    pt.vColors.forEach((n, idx) => vColors[idx] = n)
    colors = pt.colors
    updateColors()
  }

  // Run something on the edges of a cell
  function updateEdges(x: number, y: number, condition: (st: number) => boolean, op: (st: number) => number) {
    const [ex, ey] = [x + 1, y + 1]
    const [idx, vIdx, hIdx] = [y * eCols + x, y * eCols + ex, ey * eCols + x];
    [idx, vIdx].filter(i => condition(vStates[i])).map(i => [i, op(vStates[i])])
        .map(([i, res]) => vStates[i] != res ? vStates[i] = res : null);
    [idx, hIdx].filter(i => condition(hStates[i])).map(i => [i, op(hStates[i])])
        .map(([i, res]) => hStates[i] != res ? hStates[i] = res : null);
  }

  const isSelected = (st: number) => st === eStates.selected || st === eStates.selectedError
  const withEdges = (x: number, y: number, cond: (st: number) => boolean, cb: (st: number) => any) =>
      updateEdges(x, y, cond, st => { cb(st); return st })
  const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < cols && y < rows

  // Dots are different from numbers. Lines go out from the dots and round the numbers
  const edgesFromDot = (x: number, y: number, cb: (st: number, v: boolean, idx: number, x: number, y: number) => any) => {
    const [idx, vIdx, hIdx] = [[x, y], [x, y - 1], [x - 1, y]];
    [idx, vIdx].filter(([x, y]) => inBounds(x, y))
        .map(([x, y]) => cb(vStates[y * eCols + x], true, y * eCols + x, x, y));
    [idx, hIdx].filter(([x, y]) => inBounds(x, y))
        .map(([x, y]) => cb(hStates[y * eCols + x], false, y * eCols + x, x, y));
  }

  // Check the validity of a position and auto cross
  function clearAutoMark(x: number, y: number) {
    if (!inBounds(x, y)) return
    updateEdges(x, y, (st) => st === eStates.autoCrossed, (_) => eStates.none)
    updateEdges(x, y, (st) => st === eStates.selectedError, (_) => eStates.selected)

  }

  function checkDot(x: number, y: number): boolean {
    // Check if the number of edges going out from the dot is less than 2
    let dotCount = 0
    edgesFromDot(x, y, (st) => dotCount += +isSelected(st))
    if (dotCount > 2) {
      edgesFromDot(x, y, (st, v, idx) => { if (isSelected(st)) {
        if (v) vStates[idx] = eStates.selectedError
        else hStates[idx] = eStates.selectedError
      }})
    }
    return dotCount === 2 || dotCount === 0
  }

  function checkPos(x: number, y: number): boolean {
    if (!inBounds(x, y) || nMask[y * cols + x] === 1) return true

    // Count the number of neighboring edges
    let count = 0
    withEdges(x, y, (st) => st === 1, (_) => count++)

    const n = numbers[y * cols + x]
    // If count > n, invalidate the cell
    numberState[y * cols + x] = +(count > n)

    if (count === n) {
      // If count == n, cross out remaining edges
      updateEdges(x, y, (st) => st === eStates.none, (_) => eStates.autoCrossed)
      numberState[y * cols + x] = nStates.complete
    }
    
    return count === n
  }

  // Positions for click handling [offset x, offset y, horizontal/vertical], [center rel pos x, rel pos y]
  const borders = [
    [[0, 0, 0], [cfg.totalW / 2, 0]], [[0, 0, 1], [0, cfg.totalW / 2]],
    [[0, 1, 0], [cfg.totalW / 2, cfg.totalW]], [[1, 0, 1], [cfg.totalW, cfg.totalW / 2]]
  ]
  // 5x5 grid around the clicked cell
  const updateArea = Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) =>
      [i - 2, j - 2, +(Math.abs(i - 2) == 2 || Math.abs(j - 2) == 2)])).flat()

  // Called when the user starts dragging
  function startDrag(event: MouseEvent) {
    if (mode === 'mask') return
    dragging = true
  }

  // Called when the user clicks on the grid
  function clickDiv(event: MouseEvent) {
    if (mode === 'mask') return

    // Dragging is only for applying colors for now
    const [move, color] = [event.type === 'mousemove', mode === 'color']
    if (move && !color) return

    // Compute the x and y coordinates of the clicked cell
    const rect = grid.getBoundingClientRect()
    const [fx, fy] = [(event.clientX - rect.left), (event.clientY - rect.top)]
    const [sx, sy] = [Math.floor(fx / cfg.totalW), Math.floor(fy / cfg.totalW)]
    const [ofx, ofy] = [fx - sx * cfg.totalW, fy - sy * cfg.totalW] // Offset from the top left corner

    // Find the border that's closest to the click
    const [osx, osy, vertical] = borders[borders.reduce((acc, [_, [cx, cy]], idx) => {
      const [ox, oy] = [Math.abs(cx - ofx), Math.abs(cy - ofy)]
      return (ox + oy < acc[1]) ? [idx, ox + oy] : acc
    }, [0, Infinity])[0]][0];
    const idx = (sy + osy) * eCols + (sx + osx)

    // Flip the state of the edge
    const state = event.type === 'contextmenu' ? 2 : 1
    if (color) {
      if (vertical) vColors[idx] = ci
      else hColors[idx] = ci
    }
    else {
      if (vertical) vStates[idx] = vStates[idx] % 3 !== state ? state : 0
      else hStates[idx] = hStates[idx] % 3 !== state ? state : 0
    }

    // Check the validity of the clicked cell and its neighbors (check 5x5 but clean only 3x3)
    updateArea.forEach(([dx, dy, outer]) => outer ? 0 : clearAutoMark(sx + dx, sy + dy))
    updateArea.forEach(([dx, dy, _]) => checkPos(sx + dx, sy + dy))
    updateArea.forEach(([dx, dy, _]) => checkDot(sx + dx, sy + dy))

    event.preventDefault()
  }

  function genNumbers() {
    // Loop through each cell and count the number of edges
    range(rows).forEach(y => range(cols).forEach(x => {
      let count = 0
      withEdges(x, y, (st) => st === 1, (_) => count++)
      numbers[y * cols + x] = count
      nMask[y * cols + x] = 0
    }))
  }

  // Mask the numbers
  function editModeClickNumber(event: MouseEvent, x: number, y: number) {
    if (mode !== 'mask') return
    nMask[y * cols + x] = nMask[y * cols + x] === 0 ? 1 : 0
    updateArea.forEach(([dx, dy, outer]) => outer ? 0 : clearAutoMark(x + dx, y + dy))
    updateArea.forEach(([dx, dy, _]) => checkPos(x + dx, y + dy))
  }

  async function editModeReduce(zeros: boolean = false, n = 20) {
    [solutionHStates, solutionVStates] = [hStates.slice(), vStates.slice()]
    if (n === 0) return
    // On each iteration, randomly mask n numbers and try to solve the puzzle
    // If the puzzle is solvable, continue until it's not solvable, then reduce n and unmask the last 3 numbers
    let masked = [], i = 0
    while (masked.length < n) {
      let idx = randInt(0, rows * cols)
      if (nMask[idx] === 1 || (zeros && numbers[idx] !== 0)) continue
      nMask[idx] = 1
      masked.push(idx)
      if (++i > 1000) break
    }
    console.log(masked.map(idx => numbers[idx]))
    let {horiStates, vertStates, solvable} = await solve(rows, cols, numbers, nMask)
    console.log(horiStates, vertStates, solvable);

    // Unsolvable or doesn't match the solution
    if (!solvable ||
        horiStates.some((st, idx) => (st === eStates.selected) !== (solutionHStates[idx] === eStates.selected)) ||
        vertStates.some((st, idx) => (st === eStates.selected) !== (solutionVStates[idx] === eStates.selected))) {
      masked.forEach(idx => nMask[idx] = 0)
      console.log('Solution does not match')
      setTimeout(() => editModeReduce(zeros, n - 1), 100)
    } else setTimeout(() => editModeReduce(zeros, n), 100)
    console.log(nMask)
  }

  // Check the solution
  function checkSolution(): string {
    // 1. Check if all numbers are rounded with the correct number of edges
    for (let y of range(rows)) for (let x of range(cols)) if (!checkPos(x, y))
      return `❌ Some numbers are not surrounded by the correct number of edges. (${x}, ${y})`

    // 2. Check if all dots have exactly 2 edges
    for (let y of range(rows)) for (let x of range(cols)) if (!checkDot(x, y))
      return `❌ Some edges are not connected. (${x}, ${y})`

    // 3. Check if all edges are connected and there is only one loop (a single DFS should cover all edges)
    const visited = [zero8(eRows * eCols), zero8(eRows * eCols)]
    const dfs = (x: number, y: number, v: boolean) => {
      if (visited[+v][y * eCols + x] === 1) return
      visited[+v][y * eCols + x] = 1
      console.log('DFS', x, y, ['H', 'V'][+v])
      edgesFromDot(x, y, (st, vn, _, ex, ey) => isSelected(st) && dfs(ex, ey, vn))
      edgesFromDot((x + +!v), (y + +v), (st, vn, _, ex, ey) => isSelected(st) && dfs(ex, ey, vn))
    }
    // Find the first dot to start the DFS
    let startI = vStates.findIndex(st => st === eStates.selected)
    if (startI === -1) return "No edges are selected"
    dfs(startI % eCols, Math.floor(startI / eCols), true)
    console.log(visited);

    // Check if all edges selected in hStates and vStates are visited
    const allVisited = hStates.every((st, idx) => st === eStates.selected ? visited[0][idx] === 1 : true) &&
        vStates.every((st, idx) => st === eStates.selected ? visited[1][idx] === 1 : true)
    if (!allVisited) return "❌ Multiple loops detected, there must be only one loop!"

    complete = true
    return `Congratulations! You've solved the puzzle in ${Fmt.duration(elapsed)}! 🎉`
  }
</script>

<main class:color-mode={mode === 'color'} class:colorful-cross={true}>
  <div class="heading">Azalea's Colorful Slither Link</div>
  <div class="sub-heading">
    <img src={viteLogo} alt="Logo"/>
    <span><a href="https://github.com/hykilpikonna/slither-link">GitHub</a> | <a href="https://aza.moe">Blog</a></span>
    <img src={svelteLogo} alt="Logo"/>
  </div>
  <div class="rules">
    Welcome to SlitherLink! 🧩 The rules are simple: Draw lines between the dots to create one big loop (no crossings, no branches). The numbers are your hints – they tell you how many lines should surround them. Left-click to draw, right-click to mark with an X. Can you crack the perfect path?
  </div>

  {#if statusMsg}
    <div class="status" class:error={!complete}>{statusMsg}</div>
  {/if}

  <div class="timer">{Fmt.duration(elapsed)}</div>
  <div class="puzzle-grid" style={`height: ${rows * cfg.totalW}px; width: ${cols * cfg.totalW}px;`}
       on:click={clickDiv} on:contextmenu={clickDiv} on:keypress={console.log} role="grid" tabindex="0"
       on:mousedown={startDrag} on:mousemove={e => dragging && clickDiv(e)} on:mouseup={() => dragging = false}
       bind:this={grid}>
    {#each range(rows) as y}
      {#each range(cols) as x}
        <Number x={x} y={y} n={numbers[y * cols + x]} on:click={(e) => editModeClickNumber(e, x, y)}
                masked={nMask[y * cols + x] === 1} state={numberState[y * cols + x]}/>
      {/each}
    {/each}
    {#each range(eRows) as y}
      {#each range(cols) as x}
        <Line sx={x} sy={y} state={hStates[y * eCols + x]} colorIdx="{hColors[y * eCols + x]}"/>
      {/each}
    {/each}
    {#each range(rows) as y}
      {#each range(eCols) as x}
        <Line sx={x} sy={y} vertical state={vStates[y * eCols + x]} colorIdx="{vColors[y * eCols + x]}"/>
      {/each}
    {/each}
  </div>

  {#if editMode}
    <div class="btn-div">
      {#if mode === 'mask'}
        <button on:click={() => {
          hStates.forEach((_, idx) => hStates[idx] = eStates.none)
          vStates.forEach((_, idx) => vStates[idx] = eStates.none)
        }}>Clear Lines</button>
        <button on:click={() => {
           solve(rows, cols, numbers, nMask).then(({horiStates, vertStates, solvable}) => {
             console.log(horiStates, vertStates, solvable)
             horiStates.forEach((st, idx) => hStates[idx] = st)
             vertStates.forEach((st, idx) => vStates[idx] = st)
           })
        }}>Solve</button>

        <button on:click={() => editModeReduce()}>Reduce</button>
        <button on:click={() => editModeReduce(true, 5)}>Reduce Zeros</button>
      {:else}
        <button on:click={() => {
          [numbers, numberState] = [zero8(rows * cols), zero8(rows * cols)]
          nMask = Int8Array.from({ length: rows * cols }, () => 1)
        }}>Clear Numbers</button>

        <button on:click={() => genNumbers()}>Gen Numbers</button>
        <button on:click={() => JsonTy.download(ckpt(), 'slitherlink-checkpoint.json')}>Download</button>
      {/if}
      <button on:click={() => mode = modes[(modes.indexOf(mode) + 1) % modes.length]}>Mode: {mode}</button>
    </div>

    <div class="btn-div">
      <button on:click={() => console.log(statusMsg = checkSolution())}>Check Solution</button>
    </div>

    <!-- Edit Colors (input for now, maybe a color picker later) -->
    {#if mode === 'color'}
      <div class="btn-div">
        <button on:click={() => colors = [...colors, "#90A4AE"]}>+</button>
        {#each colors as color, idx}
          <button class="color-picker" on:click={() => ci = idx} aria-label="color" class:selected={ci === idx}>
            <input type="color" value={color} on:input={e => { colors[idx] = e.target.value; updateColors() }}/>
          </button>
        {/each}
      </div>
    {/if}
  {/if}

  <!-- Add Checkpoint -->
  <div class="btn-div">
    <button on:click={savePt(() => ckpts.push(ckpt()))}>Add</button>
    <button on:click={savePt(() => ckpts[ckpts.length - 1] = ckpt())}>Overwrite</button>
    <button on:click={savePt(() => ckpts.shift())}>Remove</button>
    {#each ckpts as cp, i}<button on:click={() => restorePt(cp)}>{i + 1}</button>{/each}
  </div>
</main>
