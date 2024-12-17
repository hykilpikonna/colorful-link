<script lang="ts">
  import App from "./App.svelte";
  import { Backend, type Checkpoint } from "./utils";

  // Get puzzle id from params
  const urlParams = new URLSearchParams(window.location.search);
  const puzzleId = urlParams.get("puzzle");
  let puzzleData: Checkpoint | null = null;

  if (!puzzleId) window.location.href = "/?puzzle=meow";
  else Backend.get(puzzleId).then((data) => (puzzleData = data));
</script>

{#if puzzleData !== null && puzzleId !== null}
  <App {puzzleData} {puzzleId} />
{:else}
  <div class="overlay">
    <div>
      {#if puzzleId === null}
        <a href="/?puzzle=meow">Redirecting...</a>
      {:else}
        <div>Loading...</div>
      {/if}
    </div>
  </div>
{/if}
