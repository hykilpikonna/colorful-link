<script lang="ts">
  import { fade } from "svelte/transition"
  import { Backend, type Checkpoint } from "../utils";

  export let data: Checkpoint | null = null

  let name = ""
  let author = ""
  let description = ""
  let error = ""

  let id = ""
  $: url = id ? `https://${window.location.host}/?puzzle=${id}` : ""

  function upload() {
    if (!data) return
    if (!name || !author || !description) {
      error = "Please fill in all fields"
      return
    }
    Backend.post({name, author, description, ...data}).then(res => {
      id = res.id
      console.log(res);
    }).catch(e => alert(e))
  }
</script>

{#if data}
  <div class="overlay" transition:fade>
    <div>
      {#if !id}
        <h2>Upload Puzzle</h2>

        {#if error}
          <p class="error">{error}</p>
        {:else}
          <p>Upload your puzzle to the server</p>
        {/if}

        <input type="text" placeholder="Puzzle Name" bind:value={name}>
        <input type="text" placeholder="Author" bind:value={author}>
        <textarea placeholder="Description" bind:value={description}></textarea>
        <button on:click={upload}>Upload</button>
      {:else}
        <h2>Uploaded 🥳</h2>
        <span>Your puzzle has been uploaded to the server</span>

        <p>You can share it by the following link: </p>
        <p><a href={url}>{url}</a></p>
        <p>Thank you for your creation!</p>
        <button on:click={() => data = null}>Close</button>
      {/if}
    </div>
  </div>
{/if}
