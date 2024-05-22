<script lang="ts">
  import OpenAI from "openai";
  import PriceTracker from "./PriceTracker.svelte";

  const API = import.meta.env.VITE_OPENAI_API_KEY;
  const openai = new OpenAI({ apiKey: API, dangerouslyAllowBrowser: true });

  let inputTokens = 0;
  let outputTokens = 0;
  let completionTime = 0;
  let chatLog = "";
  let chatLock = false;
  let input: string = "";
  let model = "gpt-4o";
  let prompt: string =
    "You are a chatbot named Mimesis. Try and come off personalable rather than formal. Try and keep chats as conversational as possible. DO NOT USE LISTS. DO NOT MAKE A NUMBERED LIST UNLESS SPECIFICALLY ASKED.";
  let mode = "mimesis";
  let chatHistory: Array<any> = [];

  function addToHistory(role: string, content: string) {
    chatHistory.push({ role, content });
  }

  function processMessage(input: any, isBot: boolean) {
    let counter = 0;
    let _input = input;

    if (isBot) {
      _input = input.choices[0].message.content;
    }

    _input = _input.replace(/\n/g, "<br>");
    _input = _input.replace(/```/g, () => {
      counter += 1;
      if (counter > 1) {
        counter = 0;
      }
      if (counter === 1) {
        return "<div class='mockup-code'><pre data-prefix='$'><code>";
      } else {
        return "</code></pre></div>";
      }
    });
    if (isBot) {
      addToHistory("assistant", _input);
      outputTokens += input.usage.completion_tokens;
      inputTokens += input.usage.prompt_tokens;
      return (
        "<div class='chat chat-start text-left flex flex-col space-y-0'><div class='chat-bubble'>" +
        _input +
        "</div><div class='text-[11px] italic'>(Completion time: " +
        completionTime +
        "; i:" +
        input.usage.prompt_tokens +
        " o:" +
        input.usage.completion_tokens +
        "; Model: " +
        input.model +
        ")</div></div>"
      );
    } else {
      addToHistory("user", _input);
      return (
        "<div class='chat chat-end'><div class='chat-bubble text-right'>" +
        _input +
        "</div></div>"
      );
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const textarea = e.target as HTMLTextAreaElement; // Type assertion
    if (!textarea) return;
    e.preventDefault();
    const startPosition = textarea.selectionStart;
    const endPosition = textarea.selectionEnd;
    input = input.slice(0, startPosition) + "\n" + input.slice(endPosition);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = startPosition + 1;
    }, 0);
  };

  const handleMessage = async () => {
    if (chatLock === false && input != "") {
      chatLock = true;
      chatLog += processMessage(input, false);
      console.log(input);
      input = "";
      let completion: any;

      try {
        let startTime = Date.now();
        completion = await openai.chat.completions.create({
          model: model,
          messages: chatHistory,
        });
        let endTime = Date.now();
        completionTime = (endTime - startTime) / 1000;
        chatLock = false;
        chatLog += processMessage(completion, true);
        console.log(completion.choices[0].message.content);
        console.log(inputTokens, outputTokens);
      } catch (error) {
        console.log(error);
        alert("Something went wrong");
        chatLock = false;
      }
    }
  };

  const handlePromptChange = () => {
    if (mode === "mimesis") {
      chatHistory = [];
      prompt =
        "You are a chatbot named Mimesis. Try and come off personalable rather than formal. Try and keep chats as conversational as possible. DO NOT USE LISTS. DO NOT MAKE A NUMBERED LIST UNLESS SPECIFICALLY ASKED.";
      addToHistory("system", prompt);
    }
    if (mode === "coding") {
      chatHistory = [];
      prompt =
        "Your name is Mimesis and you are a coding assistant. Answer questions as succinctly as possible. Rely on code whenever possible. Assume the user has a good understanding of coding and refrain from unwarrented details if they may come off trivial or unnecessary. Keep linguistic responses as short as possible but do not be afraid to produce longform code.";
      addToHistory("system", prompt);
    }
    if (mode === "custom") {
      prompt = "";
    }
  };

  const handleCustomPrompt = () => {
    chatHistory = [];
    addToHistory("system", prompt);
  };

  const clearChat = () => {
    chatHistory = [];
    chatLog = "";
    outputTokens = 0;
    inputTokens = 0;
  };
</script>

<div>
  <button
    on:click={() => {
      clearChat();
    }}
  >
    <p
      class="font-logo font-bold text-[110px] tracking-[-8px] mt-[-20] mb-[-55px]"
    >
      {#if mode === "coding"}
        Mimesis.code
      {:else if mode === "custom"}
        Mimesis.
      {:else}
        Mimesis.dev
      {/if}
    </p>
    <p class="font-writing text-[20px] tracking-[20px] mb-12">chatbot</p>
  </button>
</div>

<!--GPT model select-->
<label>
  <select class="bg-base-100" bind:value={model}>
    <option value="gpt-4o">GPT-4o</option>
    <option value="gpt-4-turbo">GPT-4 Turbo</option>
    <option value="gpt-4">GPT-4</option>
    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
  </select>
</label>
<br />

<!--GPT prompt select-->
<label>
  <select
    class="bg-base-100"
    bind:value={mode}
    on:change={() => {
      handlePromptChange();
    }}
  >
    <option value="mimesis">Mimesis</option>
    <option value="coding">Mimesis Code</option>
    <option value="custom">Custom</option>
  </select>
</label>
{#if mode === "custom"}
  <div>
    <textarea
      placeholder="Leave empty to use no prompt"
      bind:value={prompt}
      on:change={handleCustomPrompt}
    />
  </div>
{/if}

<div class="h-96 p-6 w-full overflow-y-auto border p-2 rounded-lg g-c">
  <ul class="space-y-2">
    {@html chatLog}
  </ul>
</div>

<textarea
  bind:value={input}
  on:keydown={(e) => {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      input += "\n";
    } else if (e.shiftKey && e.key === "Enter") {
      handleKeyDown(e);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleMessage();
    }
  }}
  placeholder="Write a message..."
  style="width: 100%;"
/>

{#if !chatLock}
  <button class="btn btn-secondary" on:click={handleMessage}> Send</button>
{:else}
  <button disabled={true} class="btn btn-secondary" on:click={handleMessage}>
    <span class="loading loading-spinner"></span></button
  >
{/if}
<PriceTracker {outputTokens} {inputTokens} />
