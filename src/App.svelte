<script>
  import Site from "./components/Site.svelte";
  import { currentTheme } from "./lib/state";
</script>

<html lang="en" data-theme={$currentTheme}>
  <Site />
</html>
