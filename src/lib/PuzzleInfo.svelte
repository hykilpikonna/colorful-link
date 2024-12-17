<script lang="ts">
  export let puzzleData = {}
</script>

<div class="puzzle-desc">
  <div class="head">
    <span class="puzzle">{puzzleData?.name}</span>
    <span class="by">by {puzzleData?.author}</span>
  </div>
  <div class="desc">
    {puzzleData?.description}
  </div>
</div>

<style lang="sass">
.puzzle-desc
  text-align: left

  .puzzle
    font-weight: bold
  .by
    font-size: 0.8em
    color: #666
  .desc
    font-size: 0.8em
    color: #eee

</style>