<script>
  import { SvelteComponent } from 'svelte';
  import Chasing from "svelte-loading-spinners";

  interface ComponentProps {
    // your prop type definitions go here
  }

  class MyComponent extends SvelteComponent<{ aProp: string }> {}

  export default MyComponent;
</script>
