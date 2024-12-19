<script lang="ts">
    export let ci: number
    export let idx: number
    export let colors: string[]
    export let updateColors: () => void
    
    let input: HTMLInputElement
    $: color = colors[idx]
</script>

<div class="color-picker-div">
    <button class="color-picker" on:click={() => ci = idx} aria-label="color" class:selected={ci === idx}>
      <div class="color" style={`background-color: ${color}`} role="none"
        on:click={() => input!.click()}></div>
    </button>
    <input type="color" value={color} bind:this={input}
      on:input={e => { colors[idx] = e.target.value; updateColors() }}/>
  </div>