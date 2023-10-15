<!-- State -->

<!-- Typescript -->
<script lang="ts">
  import OpenAI from "openai";
  import { formatMessageContent } from "$lib/utils";
  import Chasing from "svelte-loading-spinners";

  const prompts = {
    coding:
      "You are an AI designed to help with coding. you can render code blocks for the user, just begin it using [cb] and [/cb] (``` will not work). Refrain from explaining what code does unless explicitly asked. Assume you are meant to either help build things or help look for and correct bugs",
  };

  let prompt: string = prompts["coding"];
  let aiMemory: string = "";
  let chatLog: string = "";
  let model: string = "gpt-4";
  let inputValue: string = "";
  let typing: boolean = false;

  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const handleSendMessage = async () => {
    // replace \n and \t with the corresponding HTML in the response content
    let responseContent = formatMessageContent(inputValue!);
    var formattedMessage = responseContent;
    chatLog =
      chatLog + '<li style="padding-top: 10px">' + formattedMessage + "</li>";
    aiMemory = aiMemory + ". <br /> " + responseContent; // note the HTML line break
    inputValue = ""; // clear the input value
    typing = true; // indicate that the AI is typing
    scroll();
    const response = await callGPT();
    typing = false; // indicate that the AI has finished typing
    responseContent = formatMessageContent(
      response.choices[0].message.content!
    );
    chatLog =
      chatLog + '<li style="padding-top: 10px">' + responseContent + "</li>";
    aiMemory = aiMemory + responseContent + ". <br /> "; // note the HTML line break
    scroll();
    console.log(inputValue);
    console.log(response.choices[0].message.content);
  };

  function scroll() {
    document.addEventListener("DOMContentLoaded", (event) => {
      let chatBox = document.getElementById("chat-box")!;
      setTimeout(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
      }, 100);
    });
  }

  const callGPT = async () => {
    let response: any;
    try {
      response = await openai.chat.completions.create({
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: aiMemory },
        ],
        model: model,
      });
    } catch {
      console.error("API call failure");
      alert("Something has gone wrong, sorry");
    }
    return response;
  };

  function handleKeydown(event: KeyboardEvent) {
    inputValue = (event.target as HTMLInputElement).value;
    if (event.key === "Enter" && !event.shiftKey && inputValue != "") {
      handleSendMessage();
      event.preventDefault();
    }
  }
</script>

<!-- HTML -->
<div class="chat-frame">
  <label>
    Model{" "}
    <select
      value={model}
      on:change={(e) => {
        model = e.currentTarget.value;
      }}
    >
      <option value="gpt-4">GPT-4</option>
      <option value="gpt-3.5-turbo">GPT-3.5</option>
      <option value="babbage-002">babbage</option>
      <option value="davinci-002">davinci</option>
    </select>
  </label>

  <div class="chat-log">
    <div class="chat-box">
      <ul>
        {@html chatLog}
      </ul>
    </div>
  </div>

  <div style="display: flex;">
    <textarea
      id="text"
      value={inputValue}
      on:keydown={(e) => {
        handleKeydown(e);
      }}
      on:change={(e) => (inputValue = e.currentTarget.value)}
    />
    <button
      on:click={() => {
        if (inputValue != "") {
          handleSendMessage();
        }
      }}
      disabled={typing}
    >
      {#if typing}
        Loading
      {:else}
        Chat
      {/if}
    </button>
  </div>
</div>

<!-- CSS -->
<style>
  :global(body) {
    font-family: Arial, sans-serif;
    background-color: #f4f4f4;
  }

  .chat-frame {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 20px;
  }

  .chat-log {
    margin-top: 20px;
    width: 550px;
    height: 400px;
    border: 1px solid #ccc;
    border-radius: 5px;
    margin-bottom: 20px;
    background-color: #fff;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
  }

  textarea {
    width: 500px;
    height: 50px;
    border: 1px solid #ddd;
    border-radius: 5px;
    padding: 10px;
  }

  button {
    width: 60px;
    height: 74px;
    border: none;
    border-radius: 5px;
    background-color: #3498db;
    color: #fff;
    transition: background-color 0.3s ease;
    font-size: x-large;
  }

  button:hover {
    background-color: #2980b9;
  }

  .chat-box {
    overflow-y: auto;
    height: 370px;
    width: 475px;
    word-break: break-word;
    padding: 15px;
  }

  .chat-frame {
    max-width: 600px;
    margin: 0 auto;
    padding: 0.5em;
    color: #333;
    background: #fff;
    border-radius: 0.5em;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    transform: scale(1.05);
    transition: transform 0.5s ease-in-out;
  }

  .chat-frame:hover,
  .chat-frame:focus,
  .chat-frame:active {
    transform: scale(1.05);
  }

  button {
    cursor: pointer;
    background-color: #54ba18;
    color: #fff;
  }

  button:disabled {
    background-color: #999;
  }
</style>
