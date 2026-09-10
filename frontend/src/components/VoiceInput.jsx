import { useEffect, useRef, useState } from "react";
import { speechLocale } from "../lib/languages.js";

function SpeechRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function VoiceInput({ lang, value, maxLength, onChange }) {
  const Ctor = SpeechRecognitionCtor();
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");
  const recRef = useRef(null);
  const baselineRef = useRef("");

  useEffect(() => {
    return () => {
      recRef.current?.stop();
    };
  }, []);

  if (!Ctor) return null;

  function applyTranscript(spoken, isFinal) {
    const baseline = baselineRef.current.trim();
    const piece = spoken.trim();
    const next = [baseline, piece].filter(Boolean).join(" ");
    onChange(next.slice(0, maxLength));
    if (isFinal) setStatus("");
  }

  function stop() {
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
  }

  function start() {
    setStatus("");
    baselineRef.current = value || "";
    const recognition = new Ctor();
    recRef.current = recognition;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.lang = lang === "auto" ? navigator.language || "en-US" : speechLocale(lang);

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) finalText += chunk;
        else interim += chunk;
      }
      applyTranscript(finalText || interim, Boolean(finalText));
    };

    recognition.onerror = (event) => {
      const code = event.error;
      if (code === "not-allowed") {
        setStatus("Mic permission blocked");
      } else if (code === "no-speech") {
        setStatus("No speech heard");
      } else if (code !== "aborted") {
        setStatus("Mic failed — try Chrome or Edge");
      }
      setListening(false);
      recRef.current = null;
    };

    recognition.onend = () => {
      setListening(false);
      recRef.current = null;
    };

    try {
      recognition.start();
      setListening(true);
    } catch {
      setStatus("Mic is already in use");
      setListening(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={listening ? stop : start}
        className={`ghost-btn inline-flex h-9 items-center gap-2 rounded-full px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[#e8d5c4] transition ${
          listening ? "mic-live text-copper" : ""
        }`}
        aria-pressed={listening}
        aria-label={listening ? "Stop voice input" : "Dictate source text"}
      >
        {listening ? (
          <span className="relative flex h-3.5 w-3.5 items-center justify-center">
            <span className="absolute h-3.5 w-3.5 rounded-full bg-copper/40" />
            <span className="h-2 w-2 rounded-full bg-copper" />
          </span>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 15.5a3.5 3.5 0 003.5-3.5V7a3.5 3.5 0 10-7 0v5a3.5 3.5 0 003.5 3.5z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M19 12a7 7 0 01-14 0M12 19v2"
            />
          </svg>
        )}
        {listening ? "Listening" : "Speak"}
      </button>
      {status && <span className="font-mono text-[10px] text-[#f0b4a4]">{status}</span>}
    </div>
  );
}
