<script lang="ts">
  import { cfg, pos } from "../utils";

  interface Props { sx: number, sy: number, vertical?: boolean, state: number }
  let { sx, sy, vertical, state }: Props = $props()

  let left = cfg.totalW * sx
  let top = cfg.totalW * sy
  let styles = pos(left, top)
</script>

<div class="grid-line" style="{styles}"
     class:vertical={vertical}
     class:selected={state === 1} class:crossed={state === 2} class:auto-crossed={state === 5}>
</div>
