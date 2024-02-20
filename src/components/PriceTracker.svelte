<script lang="ts">
  export let inputTokens = 0;
  export let outputTokens = 0;

  let totalPrice = 0.0;
  let inputTokenPrice = 0.01 / 1000;
  let outputTokenPrice = 0.03 / 1000;
  $: totalPrice = parseFloat(
    (
      inputTokenPrice * inputTokens +
      outputTokenPrice * outputTokens
    ).toPrecision(2)
  );
</script>

<div>
  Conversation has cost ${totalPrice} in API calls
</div>
