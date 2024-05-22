<script lang="ts">
  import { onMount } from "svelte";
  import OpenAI from "openai";
  import fs from "fs";

  let voices: any = [];
  let selectedVoice: any = null;
  let input: string = "";
  let prompt: string =
    "You are a chatbot named Mimesis. Try and come off personalable rather than formal. Try and keep chats as conversational as possible. You will be speaking aloud so use short responses. Prioritize quick responses. If a question sounds too technical, suggest they try your text chat feature instead. DO NOT USE LISTS. DO NOT MAKE A NUMBERED LIST UNLESS SPECIFICALLY ASKED.";
  let isSupported = false;
  let chatLock = false;
  let chatHistory = "";
  const API = import.meta.env.VITE_OPENAI_API_KEY;

  const openai = new OpenAI({ apiKey: API, dangerouslyAllowBrowser: true });

  function getVoices() {
    voices = window.speechSynthesis.getVoices();
    selectedVoice = voices.find(
      (voice: any) => voice.name === "Google US English"
    );
    isSupported = !!selectedVoice;
  }

  if (typeof window !== "undefined") {
    window.speechSynthesis.onvoiceschanged = getVoices;
  }

  function speak(response: string) {
    if (!response || !selectedVoice) return;

    const utterance = new SpeechSynthesisUtterance(response);
    utterance.voice = selectedVoice;
    window.speechSynthesis.speak(utterance);
  }

  async function processMP3() {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream("../assets/test.mp3"),
      model: "whisper-1",
    });

    console.log(transcription.text);
  }

  const handleMessage = async () => {
    if (!chatLock && input != "") {
      chatLock = true;
      console.log(input);
      chatHistory += input + " ";
      input = "";
      let completion: any;

      try {
        completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: chatHistory },
          ],
        });
        let response: string = completion.choices[0].message.content;
        chatHistory += response + " ";
        speak(response);
        console.log(response);
        chatLock = false;
      } catch (error) {
        console.log(error);
        alert("Something went wrong");
        chatLock = false;
      }
    }
  };

  onMount(() => {
    getVoices();
  });
</script>

{#if isSupported}
  <textarea bind:value={input} rows="4" cols="50"></textarea>
  <br />
  <button on:click={handleMessage}>Speak</button>
  <button on:click={processMP3}>Test</button>
{:else}
  <p>The browser is not supported</p>
{/if}
