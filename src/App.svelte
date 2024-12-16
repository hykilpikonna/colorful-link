<script lang="ts">
  import svelteLogo from './assets/svelte.svg'
  import viteLogo from '/vite.svg'
  import Number from './lib/Number.svelte'
  import { cfg, eStates, nStates, randInt, range } from "./utils";
  import Line from "./lib/Line.svelte";
  import { cat } from "./examples";

  const [rows, cols] = [40, 40]
  const [eRows, eCols] = [rows + 1, cols + 1]
  let numbers = Int8Array.from({ length: rows * cols }, () => 0)
  let numberMasked = Int8Array.from({ length: rows * cols }, () => 1)
  let numberState = Int8Array.from({ length: rows * cols }, () => 0)
  let hStates = Int8Array.from({ length: eRows * eCols }, () => 0)
  let vStates = Int8Array.from({ length: eRows * eCols }, () => 0)

  let grid: HTMLDivElement
  const editMode = true

  // Run something on the edges of a cell
  function updateEdges(x: number, y: number, condition: (st: number) => boolean, op: (st: number) => number) {
    const [ex, ey] = [x + 1, y + 1]
    const [idx, vIdx, hIdx] = [y * eCols + x, y * eCols + ex, ey * eCols + x];
    [idx, vIdx].filter(i => condition(vStates[i])).map(i => [i, op(vStates[i])])
        .map(([i, res]) => vStates[i] != res ? vStates[i] = res : null);
    [idx, hIdx].filter(i => condition(hStates[i])).map(i => [i, op(hStates[i])])
        .map(([i, res]) => hStates[i] != res ? hStates[i] = res : null);
  }

  const withEdges = (x: number, y: number, cond: (st: number) => boolean, cb: (st: number) => any) =>
      updateEdges(x, y, cond, st => { cb(st); return st })
  const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < cols && y < rows

  // Check the validity of a position and auto cross
  function clearAutoMark(x: number, y: number) {
    if (!inBounds(x, y)) return
    updateEdges(x, y, (st) => st === eStates.autoCrossed, (_) => eStates.none)
  }

  function checkPos(x: number, y: number) {
    if (!inBounds(x, y)) return

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
  }

  // Positions for click handling [offset x, offset y, horizontal/vertical], [center rel pos x, rel pos y]
  const borders = [
    [[0, 0, 0], [cfg.totalW / 2, 0]], [[0, 0, 1], [0, cfg.totalW / 2]],
    [[0, 1, 0], [cfg.totalW / 2, cfg.totalW]], [[1, 0, 1], [cfg.totalW, cfg.totalW / 2]]
  ]
  // 5x5 grid around the clicked cell
  const updateArea = Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) =>
      [i - 2, j - 2, +(Math.abs(i - 2) == 2 || Math.abs(j - 2) == 2)])).flat()

  // Called when the user clicks on the grid
  function clickDiv(event: MouseEvent) {
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
    const state = event.type === 'click' ? 1 : 2
    if (vertical) vStates[idx] = vStates[idx] === state ? 0 : state
    else hStates[idx] = hStates[idx] === state ? 0 : state

    // Check the validity of the clicked cell and its neighbors (check 5x5 but clean only 3x3)
    updateArea.forEach(([dx, dy, outer]) => outer ? 0 : clearAutoMark(sx + dx, sy + dy))
    updateArea.forEach(([dx, dy, _]) => checkPos(sx + dx, sy + dy))

    event.preventDefault()
  }

  // Editor mode
  if (editMode) {
    cat.solution.forEach(edge => {
      const [ sx, sy, ex, _ ] = edge
      if (sx === ex) { // Vertical edge
        // The commented lines will show the solution (edges)
        // vStates[sy * (eCols) + sx] = 1
        if (ex != cols) numbers[sy * cols + sx] += 1
        if (sx != 0) numbers[sy * cols + sx - 1] += 1
      } else {
        // hStates[sy * (eCols) + sx] = 1
        if (ex != rows) numbers[sy * cols + sx] += 1
        if (sx != 0) numbers[(sy - 1) * cols + sx] += 1
      }
    })

    // Check the validity of all cells
    range(rows).forEach(y => range(cols).forEach(x => checkPos(x, y)))
  }
</script>

<main>
  <div class="heading">
    <img src={viteLogo} class="logo" alt="Vite Logo" />
    <span class="title">Slither Link</span>
    <img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
  </div>
  {#if editMode}<div class="edit-mode-banner">Edit Mode</div>{/if}

  <div class="puzzle-grid" style={`height: ${rows * cfg.totalW}px; width: ${cols * cfg.totalW}px;`}
       on:click={clickDiv} on:contextmenu={clickDiv} on:keypress={console.log} role="grid" tabindex="0"
       bind:this={grid}>
    {#each range(rows) as y}
      {#each range(cols) as x}
        <Number x={x} y={y} n={numbers[y * cols + x]}
                masked={numberMasked[y * cols + x] === 0} state={numberState[y * cols + x]} />
      {/each}
    {/each}
    {#each range(eRows) as y}
      {#each range(eCols) as x}
        <Line sx={x} sy={y} state={hStates[y * eCols + x]} />
      {/each}
    {/each}
    {#each range(rows) as y}
      {#each range(cols + 1) as x}
        <Line sx={x} sy={y} vertical state={vStates[y * eCols + x]} />
      {/each}
    {/each}
  </div>
</main>

<style lang="sass">
  main
    display: flex
    flex-direction: column
    gap: 1em
    padding: 1em

  .heading
    display: flex
    justify-content: center
    align-items: center
    gap: 1em
    will-change: filter
    transition: filter 300ms

    &:hover
      filter: drop-shadow(0 0 2em #646cffaa)

  .edit-mode-banner
    font-size: 1.2em
    text-align: center
    color: #55c7e8

  .title
    font-size: 3em
    line-height: 1.1

  .logo
    height: 3em
    padding: 1.5em
</style>
