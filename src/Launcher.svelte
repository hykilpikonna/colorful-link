<script lang="ts">
  import App from "./App.svelte";
  import { Backend, type MetaCheckpoint } from "./utils";

  // Get puzzle id from params
  const urlParams = new URLSearchParams(window.location.search);
  const puzzleId = urlParams.get("puzzle");
  const edit = urlParams.get("edit");
  let puzzleData: MetaCheckpoint | null = null;
  let error: string | null = null;

  if (!edit) {
    if (!puzzleId) window.location.href = "/?puzzle=heart";
    else Backend.get(puzzleId).then((data) => (puzzleData = data)).catch(e => (error = e));
  }
</script>

{#if puzzleData !== null && puzzleId !== null}
  <App {puzzleData} {puzzleId} />
{:else if edit}
  <App></App>
{:else}
  <div class="overlay">
    <div>
      {#if puzzleId === null}
        <a href="/?puzzle=heart">Redirecting...</a>
      {:else if error}
        <h2 class="error">Error</h2>
        <span>{error}</span>
      {:else}
        <h2>Loading...</h2>
        <span>Fetching puzzle data...</span>
      {/if}
    </div>
  </div>
{/if}
