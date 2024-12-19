<script lang="ts">
  import { cfg, nStates, pos, sty } from "../utils";

  interface Props { x: number, y: number, n: number, masked: boolean, state: number }
  let { x, y, n, masked, state }: Props = $props()

  let left = cfg.totalW * x + cfg.lineW
  let top = cfg.totalW * y + cfg.lineW
  let styles = pos(left, top)
</script>

<div class="grid-number" style="{styles}"
     class:error={state === nStates.error} class:complete={state === nStates.complete} on:click>
  {#if !masked}
    {n}
  {/if}
</div>
