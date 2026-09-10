import { useEffect, useState } from "react";
import { speechLocale } from "../lib/languages.js";

function findVoice(lang) {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const locale = speechLocale(lang).toLowerCase();
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang.toLowerCase() === locale) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith(locale.slice(0, 2))) ||
    null
  );
}

export default function SpeakButton({ text, lang }) {
  const [speaking, setSpeaking] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);

  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!supported) return undefined;
    const sync = () => setVoicesReady(true);
    sync();
    window.speechSynthesis.addEventListener("voiceschanged", sync);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", sync);
  }, [supported]);

  if (!supported) return null;

  const voice = voicesReady ? findVoice(lang) : null;
  const voicesLoaded = voicesReady && window.speechSynthesis.getVoices().length > 0;

  if (voicesLoaded && !voice) return null;

  function speak() {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLocale(lang);
    const nextVoice = findVoice(lang);
    if (nextVoice) utterance.voice = nextVoice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function stop() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  return (
    <button
      type="button"
      onClick={speaking ? stop : speak}
      disabled={!text}
      className="ghost-btn inline-flex h-9 items-center gap-2 rounded-full px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[#e8d5c4] transition disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={speaking ? "Stop speaking" : "Speak translation"}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M9 9H5a1 1 0 00-1 1v4a1 1 0 001 1h4l5 4V5L9 9z"
        />
      </svg>
      {speaking ? "Stop" : "Read"}
    </button>
  );
}
