<script lang="ts">
  import { fade } from 'svelte/transition';
  import Number from './lib/Number.svelte'
  import { cfg, eStates, Fmt, JsonTy, Misc, nStates, randInt, range, zero8, type Checkpoint, type MetaCheckpoint } from "./utils";
  import Line from "./lib/Line.svelte";
  import { solve } from "./solver";
  import PuzzleInfo from './lib/PuzzleInfo.svelte';
  import CompletedOverlay from './lib/CompletedOverlay.svelte';
  import UploadOverlay from './lib/UploadOverlay.svelte';
  import Heading from './lib/Heading.svelte';

  const params = new URLSearchParams(location.search)
  const hasTouch = Misc.hasTouch()

  // Can pass in puzzle data from props
  interface Props { puzzleId?: string, puzzleData?: MetaCheckpoint }
  export let { puzzleId, puzzleData }: Props = {}
  const pid = puzzleId ?? 'slitherlink'

  // Main variables
  const [rows, cols] = [+(puzzleData?.rows ?? params.get('size') ?? 25), +(puzzleData?.cols ?? params.get('size') ?? 25)]
  const [eRows, eCols] = [rows + 1, cols + 1]
  let [numbers, nMask, numberState] = [zero8(rows * cols), zero8(rows * cols).fill(1), zero8(rows * cols)]
  let [hStates, vStates] = [zero8(eRows * eCols), zero8(eRows * eCols)]
  let [solutionHStates, solutionVStates] = [zero8(eRows * eCols), zero8(eRows * eCols)]

  // Auto adapt grid size to screen size
  if (rows < 10 && cols < 10) {
    cfg.cellW = 50
    cfg.lineW = 8
    cfg.totalW = cfg.cellW + cfg.lineW
  }

  // Colors
  let [hColors, vColors, colors, css, ci] = [zero8(eRows * eCols), zero8(eRows * eCols), ["#90A4AE"], document.createElement('style'), 0]
  document.head.appendChild(css)
  const updateColors = () => css.innerHTML = colors.map((c, i) => `.grid-line.c${i} { --c: ${c} }`).join('\n')
  updateColors()

  // Editing controls
  let grid: HTMLDivElement
  let [editMode, dragging, colorfulCross] = [params.has('edit'), false, false]
  const modes = ['line', 'mask', 'color']
  let mode = 'line'

  // Solve Timer
  let startTime = JsonTy.lsDefault(`${pid}-start-time`, Date.now())
  let [elapsed, complete, completedOverlay, statusMsg] = [0, false, false, '']
  setInterval(() => !complete && (elapsed = Date.now() - startTime), 100)

  // Checkpoints
  const ckpt = () => ({rows, cols, hStates, vStates, numbers, nMask, hColors, vColors, colors})
  const resetPoint = JsonTy.stringify(ckpt())
  const loadPt = () => JsonTy.lsDefault(`${pid}-checkpoints`, [])
  let ckpts: Checkpoint[] = loadPt()
  const savePt = (fn: () => any) => () => { fn()
    JsonTy.lsWrite(`${pid}-checkpoints`, ckpts)
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
  let upload: Checkpoint | null
  let autoSave: Checkpoint | null = JsonTy.lsRead(`${pid}-auto-save`)
  if (autoSave) restorePt(autoSave)
  setInterval(() => { JsonTy.lsWrite(`${pid}-auto-save`, autoSave = ckpt()) }, 30 * 1000)

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
    if (color) {
      if (vertical) vColors[idx] = ci
      else hColors[idx] = ci
    }
    else if (!hasTouch) {
      // Mouse is accurate, so right click to cross, left click to select
      const state = event.type === 'contextmenu' ? 2 : 1
      if (vertical) vStates[idx] = vStates[idx] % 3 !== state ? state : 0
      else hStates[idx] = hStates[idx] % 3 !== state ? state : 0
    }
    else {
      // Touch is not accurate, click once to select, click again to cross, click again to clear
      if (vertical) vStates[idx] = (vStates[idx] + 1) % 3
      else hStates[idx] = (hStates[idx] + 1) % 3
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

  async function editModeReduce(zeros: boolean = false, n = 10) {
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
    }
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
    // TODO: Fix this
    // const allVisited = hStates.every((st, idx) => st === eStates.selected ? visited[0][idx] === 1 : true) &&
    //     vStates.every((st, idx) => st === eStates.selected ? visited[1][idx] === 1 : true)
    // if (!allVisited) return "❌ Multiple loops detected, there must be only one loop!"

    colorfulCross = true
    complete = completedOverlay = true
    return `Congratulations! You've solved the puzzle in ${Fmt.duration(elapsed)}! 🎉`
  }

  // Load puzzle data
  if (puzzleData) {
    puzzleData.numbers.forEach((n, idx) => numbers[idx] = n)
    puzzleData.nMask.forEach((n, idx) => nMask[idx] = n)
    puzzleData.hColors.forEach((n, idx) => hColors[idx] = n)
    puzzleData.vColors.forEach((n, idx) => vColors[idx] = n)
    colors = puzzleData.colors
    updateColors()

    // Update every edge
    range(eRows).forEach(y => range(eCols).forEach(x => checkPos(x, y)))
  }
</script>

<main class:color-mode={mode === 'color'} class:colorful-cross={colorfulCross} class:mobile={hasTouch} 
  style="--gcw: {cfg.cellW}px; --glw: {cfg.lineW}px; --gtw: {cfg.totalW}px;">
  <Heading/>

  {#if statusMsg}
    <div class="status" class:error={!complete}>{statusMsg}</div>
  {/if}

  <div>
    {#if puzzleData && !editMode}<div class="timer-line">
      <PuzzleInfo {puzzleData}></PuzzleInfo>
      <div class="timer">{Fmt.duration(elapsed)}</div>
    </div>{/if}
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
      {/if}
      <button on:click={() => mode = modes[(modes.indexOf(mode) + 1) % modes.length]}>Mode: {mode}</button>
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
    <div class="btn-div">
      <button on:click={() => JsonTy.download(ckpt(), 'slitherlink-checkpoint.json')}>Download</button>
      <button on:click={() => upload = ckpt()}>Upload</button>
      <button on:click={() => confirm("Are you sure you want to reset? (checkpoints will not be removed)") && 
        restorePt(JsonTy.parse(resetPoint))
      }>Reset</button>
    </div>
  {/if}

  <!-- Add Checkpoint -->
  <div class="btn-div">
    <button on:click={savePt(() => ckpts.push(ckpt()))}>Add</button>
    <button on:click={savePt(() => ckpts[ckpts.length - 1] = ckpt())}>Overwrite</button>
    <button on:click={savePt(() => ckpts.shift())}>Remove</button>
    {#each ckpts as cp, i}<button on:click={() => restorePt(cp)}>{i + 1}</button>{/each}
  </div>

  <!-- Check solution -->
  {#if !editMode}
    <div class="btn-div">
      <button on:click={() => console.log(statusMsg = checkSolution())}>Check Solution</button>
      <button on:click={() => colorfulCross = !colorfulCross}>Switch Cross</button>
    </div>
  {/if}

  <CompletedOverlay bind:completedOverlay={completedOverlay}/>
  <UploadOverlay bind:data={upload}/>
</main>
