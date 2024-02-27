<script>
  import ThemeSwitch from "./ThemeSwitch.svelte";
  import ChatBot from "./Chatbot.svelte";
  import ImageGen from "./Imagegen.svelte";
  import GithubLink from "./GithubLink.svelte";
  let chatbot = true;
</script>

<!--Navbar-->
<div class="w-full z-50 shadow-2xl flexfixed flex-col">
  <div class="navbar gap-2">
    <div class="navbar-start" />
    <div class="navbar-center">
      <button
        class={chatbot ? "btn btn-secondary" : "btn btn-secondary btn-outline"}
        on:click={() => (chatbot = true)}
        >Chat
      </button>
      <div style="width:15px" />
      <button
        class={!chatbot ? "btn btn-secondary" : "btn btn-secondary btn-outline"}
        on:click={() => (chatbot = false)}
      >
        Images
      </button>
    </div>
    <div class="relative">
      <div class="absolute pl-24">
        <div class="flex w-full">
          <div class="grid h-20 flex-growrounded-box place-items-center">
            <ThemeSwitch />
          </div>

          <div class="grid h-20 flex-grow rounded-box ml-8 place-items-center">
            <GithubLink />
          </div>
        </div>
      </div>
    </div>
    <div class="navbar-end" />
  </div>
</div>

<!--Body-->
<div class="grid z-1 pt-6 h-screen place-items-center">
  <div class="card highlight w-3/5 bg-base-100 shadow-xl">
    <div class="card-body items-center text-center">
      {#if chatbot}
        <ChatBot />
      {:else}
        <ImageGen />
      {/if}
    </div>
  </div>
</div>
