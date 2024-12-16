<script lang="ts">
  import svelteLogo from './assets/svelte.svg'
  import viteLogo from '/vite.svg'
  import Number from './lib/Number.svelte'
  import { cfg, randInt, range } from "./utils";
  import Line from "./lib/Line.svelte";
  import { cat } from "./examples";

  const [rows, cols] = [40, 40]
  const [eRows, eCols] = [rows + 1, cols + 1]
  let numbers = Int8Array.from({ length: rows * cols }, () => 0)
  let numberMasked = Int8Array.from({ length: rows * cols }, () => 1)
  let hedgeStates = Int8Array.from({ length: eRows * eCols }, () => 0)
  let vedgeStates = Int8Array.from({ length: eRows * eCols }, () => 0)

  let grid: HTMLDivElement
  const editMode = true

  // Editor mode
  if (editMode) {
    cat.solution.forEach(edge => {
      const [ sx, sy, ex, _ ] = edge
      const isVertical = sx === ex
      if (isVertical) {
        // vedgeStates[sy * (eCols) + sx] = 1
        if (ex != cols) numbers[sy * cols + sx] += 1
        if (sx != 0) numbers[sy * cols + sx - 1] += 1
      } else {
        // hedgeStates[sy * (eCols) + sx] = 1
        if (ex != rows) numbers[sy * cols + sx] += 1
        if (sx != 0) numbers[(sy - 1) * cols + sx] += 1
      }
    })
  }

  // Positions for click handling
  const borders = [
    // [offset x, offset y, horizontal/vertical], [center rel pos x, rel pos y]
    [[0, 0, 0], [cfg.totalW / 2, 0]],
    [[0, 0, 1], [0, cfg.totalW / 2]],
    [[0, 1, 0], [cfg.totalW / 2, cfg.totalW]],
    [[1, 0, 1], [cfg.totalW, cfg.totalW / 2]]
  ]

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
    const state = event.type === 'click' ? 1 : 2

    // if (vertical) vedgeStates[idx] = (vedgeStates[idx] + 1) % 3
    if (vertical) vedgeStates[idx] = vedgeStates[idx] === state ? 0 : state
    else hedgeStates[idx] = hedgeStates[idx] === state ? 0 : state

    console.log(fx, fy, sx, sy, ofx, ofy)
    event.preventDefault()
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
        <Number x={x} y={y} n={numbers[y * cols + x]} masked={numberMasked[y * cols + x] === 0} />
      {/each}
    {/each}
    {#each range(eRows) as y}
      {#each range(eCols) as x}
        <Line sx={x} sy={y} state={hedgeStates[y * eCols + x]} />
      {/each}
    {/each}
    {#each range(rows) as y}
      {#each range(cols + 1) as x}
        <Line sx={x} sy={y} vertical state={vedgeStates[y * eCols + x]} />
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
