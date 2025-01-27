<script lang="ts">
  import OpenAI from "openai";
  import PriceTracker from "./PriceTracker.svelte";
  import { marked } from "marked";
  import hljs from "highlight.js";
  import "highlight.js/styles/default.css";
  import Anthropic from "@anthropic-ai/sdk";

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  const anthropic = new Anthropic({ apiKey: apiKey });

  const GPT_API = import.meta.env.VITE_OPENAI_API_KEY;
  const openai = new OpenAI({ apiKey: GPT_API, dangerouslyAllowBrowser: true });
  const DEEPSEEK_API = import.meta.env.VITE_DEEPSEEK_API_KEY;
  const deepseek = new OpenAI({ baseURL: "https://api.deepseek.com", apiKey: DEEPSEEK_API, dangerouslyAllowBrowser: true });

  let inputTokens: number = 0;
  let outputTokens: number = 0;
  let completionTime: number = 0;
  let chatLog: string = "";
  let voices: any = [];
  let selectedVoice: any = null;
  let isSupported: boolean = false;
  let chatLock: boolean = false;
  let speakingActive: boolean = false;
  let input: string = "";
  let model: string = "deepseek-reasoner";
  let prompt: string =
    "You are a chatbot named Mimesis. Try and come off personable rather than formal. Try and keep chats as conversational as possible. DO NOT USE LISTS. DO NOT MAKE A NUMBERED LIST UNLESS SPECIFICALLY ASKED.";
  let mode: string = "mimesis";
  let chatHistory: Array<any> = [];
  const apiEndpoint = "https://88b98r.buildship.run/response";

  // Add this type definition at the top of the file
  type DeepSeekMessage = {
    content: string;
    reasoning_content?: string;
  };

  async function speak(prompt: string): Promise<string> {
    let audio: HTMLAudioElement | null = null;
    let responseText = "";
    try {
      const response = await fetch(
        `${apiEndpoint}?prompt=${encodeURIComponent(prompt)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      // Log the entire response to check for issues
      console.log("API Response Status:", response.status);
      console.log("Response Headers:", response.headers);

      responseText = await response.text();
      console.log("Response Text:", responseText); // Log output to see what the response is

      audio = new Audio(responseText);
      audio.play();
      if (!response.ok) {
        throw new Error("Failed to fetch audio URL");
      }
    } catch (err) {
      console.error("Error fetching audio:", err);
    } finally {
      return responseText;
    }
  }

  if (typeof window !== "undefined") {
    window.speechSynthesis.onvoiceschanged = getVoices;
  }

  function addToHistory(role: string, content: string) {
    chatHistory.push({ role, content });
  }

  function processMessage(input: any, isBot: boolean) {
    let messageContent = input;

    if (isBot) {
      messageContent = input.choices[0].message.content;
    }

    messageContent = markdownToHtml(messageContent);

    if (isBot) {
      addToHistory("assistant", messageContent);
      outputTokens += input.usage.completion_tokens;
      inputTokens += input.usage.prompt_tokens;
      return `
        <div class='chat chat-start text-left flex flex-col space-y-0'>
          <div class='chat-bubble'>${messageContent}</div>
          <div class='text-[11px] italic'>
            (Completion time: ${completionTime}; i:${input.usage.prompt_tokens} o:${input.usage.completion_tokens}; Model: ${input.model})
          </div>
        </div>
      `;
    } else {
      addToHistory("user", messageContent);
      return `
        <div class='chat chat-end'>
          <div class='chat-bubble text-right'>${messageContent}</div>
        </div>
      `;
    }
  }

  function markdownToHtml(markdown: string) {
    marked.setOptions({
      highlight: function (code: string, lang: string) {
        return hljs.highlightAuto(code).value;
      },
    });
    return marked(markdown);
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

      if (model === "deepseek-reasoner") {
        try {
          let startTime = Date.now();
          
          console.log("Making DeepSeek API call with messages:", chatHistory);
          const response = await deepseek.chat.completions.create({
            model: model,
            messages: chatHistory,
            stream: false,
            max_tokens: 1000  // Add explicit max_tokens
          });
          console.log("Full DeepSeek response:", JSON.stringify(response, null, 2));

          let endTime = Date.now();
          completionTime = (endTime - startTime) / 1000;

          // Get reasoning content and main content
          const reasoningContent = (response.choices[0].message as DeepSeekMessage).reasoning_content;
          const content = response.choices[0].message.content;
          
          console.log("Extracted reasoning:", reasoningContent);
          console.log("Extracted content:", content);

          // Display reasoning if present
          if (reasoningContent) {
            chatLog += `<div class='chat chat-start text-left flex flex-col space-y-0'>
              <div class='chat-bubble bg-base-300'><strong>Reasoning:</strong> ${markdownToHtml(reasoningContent)}</div>
            </div>`;
          }
          
          // Create a completion-like object for the final content
          const completion = {
            choices: [{ message: { content: content } }],
            usage: response.usage || { completion_tokens: 0, prompt_tokens: 0 },
            model: model
          };

          chatLog += processMessage(completion, true);
          
          if (speakingActive && typeof content === "string") {
            speak(content);
          }
          
          chatLock = false;
        } catch(error) {
          console.error('DeepSeek Error:', error);
          console.error('Error details:', {
            name: (error as Error).name,
            message: (error as Error).message,
            stack: (error as Error).stack
          });
          alert("Something went wrong");
          chatLock = false;
        }
      }
      if(model === "deepseek-chat") {
        try {
          let startTime = Date.now();
          let content = "";
          let totalTokens = 0;
          
          const response = await deepseek.chat.completions.create({
            model: model,
            messages: chatHistory,
            stream: false // Changed to false to get token counts
          });

          const responseContent = response.choices[0].message.content;
          if (responseContent === null) {
            throw new Error("No content received from API");
          }
          content = responseContent;
          
          // Create completion object with usage information
          const completion = {
            choices: [{ message: { content: content } }],
            usage: response.usage,
            model: model
          };

          let endTime = Date.now();
          completionTime = (endTime - startTime) / 1000;
          chatLog += processMessage(completion, true);
          if (speakingActive) {
            speak(content);
          }
          chatLock = false;
        } catch (error) {
          console.log(error);
          alert("Something went wrong");
          chatLock = false;
        }
      }
      if (model[0] === "g" || model[0] === "o") {
        try {
          let startTime = Date.now();
          let content: string;
          
          const response = await openai.chat.completions.create({
            model: model,
            messages: chatHistory,
            stream: false
          });

          const responseContent = response.choices[0].message.content;
          if (responseContent === null) {
            throw new Error("No content received from API");
          }
          content = responseContent;
          
          // Create completion object with usage information
          const completion = {
            choices: [{ message: { content: content } }],
            usage: response.usage,
            model: model
          };

          let endTime = Date.now();
          completionTime = (endTime - startTime) / 1000;
          chatLog += processMessage(completion, true);
          if (speakingActive) {
            speak(content);
          }
          chatLock = false;
        } catch (error) {
          console.log(error);
          alert("Something went wrong");
          chatLock = false;
        }
      }
      if (model[0] === "c") {
        //claude API words differently
        //a server must be made to handle this
        //this is a placeholder for now
        //claude model called
        try {
          let startTime = Date.now();
          let completion = await anthropic.messages.create({
            model: "claude-3-opus-20240229",
            max_tokens: 1000,
            temperature: 0,
            system: "Respond only with short poems.",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Why is the ocean salty?",
                  },
                ],
              },
            ],
          });
          let endTime = Date.now();
          completionTime = (endTime - startTime) / 1000;
          console.log(completion);
          // chatLog += processMessage(completion, true);
          // if(speakingActive){speak(completion.choices[0].message.content)}
          // console.log(completion.choices[0].message.content);
          // console.log(inputTokens, outputTokens);
          // chatLock = false;
        } catch {}
      }
    }
  };

  const handlePromptChange = () => {
    if (mode === "mimesis") {
      chatHistory = [];
      prompt =
        "You are a chatbot named Mimesis. Try and come off personable rather than formal. Try and keep chats as conversational as possible. DO NOT USE LISTS. DO NOT MAKE A NUMBERED LIST UNLESS SPECIFICALLY ASKED.";
      addToHistory("system", prompt);
    }
    if (mode === "coding") {
      chatHistory = [];
      prompt =
        "Your name is Mimesis and you are a coding assistant. Answer questions as succinctly as possible. Rely on code whenever possible. Assume the user has a good understanding of coding and refrain from unwarranted details if they may come off trivial or unnecessary. Keep linguistic responses as short as possible but do not be afraid to produce longform code.";
      addToHistory("system", prompt);
    }
    if (mode === "custom") {
      prompt = "";
    }
  };

  function getVoices() {
    voices = window.speechSynthesis.getVoices();
    selectedVoice = voices.find(
      (voice: any) => voice.name === "Google US English"
    );
    isSupported = !!selectedVoice;
  }

  function toggleSpeaking() {
    speakingActive = !speakingActive;
  }

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
    <option value="deepseek-reasoner">DeepSeek-R1</option>
    <option value="deepseek-chat">DeepSeek-v3</option>
    <option value="o1-preview">GPT o1-preview</option>
    <option value="o1-mini">GPT o1-mini</option>
    <option value="gpt-4o">GPT-4o</option>
    <option value="gpt-4-turbo">GPT-4 Turbo</option>
  </select>
</label>

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

<div class="form-control">
  <label class="label cursor-pointer">
    <span class="label-text">Speak &nbsp;</span>
    <input
      type="checkbox"
      class="checkbox"
      on:change={toggleSpeaking}
      checked={speakingActive}
    />
  </label>
</div>

<div class="h-96 p-6 w-full overflow-y-auto border rounded-lg g-c">
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
