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
  function clickDiv(event: MouseEvent) {
    const target = event.target as HTMLElement
    console.log(target)

    // Compute the x and y coordinates of the clicked cell
    const rect = target.getBoundingClientRect()
    const x = Math.floor((event.clientX - rect.left) / cfg.totalW)
    console.log(rect)
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
       on:click={clickDiv} on:keypress={console.log} role="grid" tabindex="0"
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
