<script lang="ts">
  import { fade } from "svelte/transition"

  export let completedOverlay = false
</script>

{#if completedOverlay}
  <div class="overlay" transition:fade><div>
    <h2>Congrats! 🎉</h2>

    <p>Great job on solving your first puzzle 🧩 </p>
    <p>This project is just starting out, I hope you enjoyed it!</p>
    <p>If you want to design your own puzzle and share with the world, you can go to <a href="/?edit=1">Edit Mode</a> and start drawing!</p>
    <p>You can find more about the creation process in the documentation on the <a href="https://github.com/hykilpikonna/colorful-link">GitHub Repo</a>.</p>
    <p>If you want to chat, you can reach me on telegram <a href="https://t.me/hykilpikonna">@hykilpikonna</a>.</p>
    <p>Thanks for playing! 🤗</p>

    <button on:click={() => completedOverlay = false}>Close</button>
  </div></div>
{/if}