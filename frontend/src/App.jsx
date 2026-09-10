import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LanguageSelect from "./components/LanguageSelect.jsx";
import CopyButton from "./components/CopyButton.jsx";
import SpeakButton from "./components/SpeakButton.jsx";
import VoiceInput from "./components/VoiceInput.jsx";
import { LIVE_TRANSLATE, LIVE_TRANSLATE_MS, MAX_TEXT_LENGTH } from "./config.js";
import { errorCopy, translate } from "./lib/api.js";
import { EXAMPLES, languageByCode } from "./lib/languages.js";

export default function App() {
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("es");
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [detected, setDetected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [swapSpin, setSwapSpin] = useState(0);
  const requestId = useRef(0);

  async function runTranslate(nextText = text) {
    const value = nextText.trim();
    if (!value) {
      setOutput("");
      setDetected("");
      setError("");
      return;
    }

    const id = ++requestId.current;
    setLoading(true);
    setError("");

    try {
      const result = await translate({
        text: value,
        sourceLang,
        targetLang,
      });
      if (id !== requestId.current) return;
      setOutput(result.translatedText || "");
      setDetected(result.detectedSourceLang || "");
    } catch (err) {
      if (id !== requestId.current) return;
      setError(errorCopy(err.code));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  useEffect(() => {
    if (!LIVE_TRANSLATE) return undefined;
    const handle = setTimeout(() => runTranslate(text), LIVE_TRANSLATE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, sourceLang, targetLang]);

  function swap() {
    const previousInput = text;
    const previousOutput = output;

    if (sourceLang === "auto") {
      const detectedCode = detected || "en";
      setSourceLang(targetLang);
      setTargetLang(detectedCode === targetLang ? "en" : detectedCode);
    } else {
      setSourceLang(targetLang);
      setTargetLang(sourceLang);
    }

    setSwapSpin((n) => n + 1);

    if (previousOutput) {
      setText(previousOutput.slice(0, MAX_TEXT_LENGTH));
      setOutput(previousInput);
    }
  }

  function onInput(event) {
    setText(event.target.value.slice(0, MAX_TEXT_LENGTH));
  }

  const detectedMeta = detected ? languageByCode(detected) : null;
  const used = Math.min(100, Math.round((text.length / MAX_TEXT_LENGTH) * 100));

  return (
    <div className="stage">
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-8 lg:py-16">
        <header className="mb-10 max-w-xl sm:mb-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-ice/80">loan translation</p>
            <h1 className="mt-2 font-display text-5xl font-extrabold lowercase tracking-[-0.06em] text-[#f7ece1] sm:text-7xl">
              calque
            </h1>
          <p className="mt-4 text-sm leading-6 text-[#cbb8a8]">
            Never let anything stop you from communicating.
          </p>
        </header>

        <div className="relative grid items-start gap-3 md:grid-cols-[1fr_3.25rem_1fr] md:gap-0">
          <article className="glass plate-in relative z-10 flex min-h-[460px] flex-col p-5 sm:p-7 md:col-start-1 md:col-end-3 md:row-start-1 md:mr-8">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-display text-sm tracking-wide text-[#f7ece1]/70">source</span>
              <span className="font-mono text-[10px] text-[#8f7d72]">{used}% of 2k</span>
            </div>
            <LanguageSelect label="Written in" value={sourceLang} onChange={setSourceLang} />
            <textarea
              value={text}
              onChange={onInput}
              placeholder="Paste a sentence, or speak it. Keep the line breaks if they matter."
              className="mt-6 min-h-[230px] flex-1 resize-none bg-transparent text-[1.15rem] leading-8 text-[#f7ece1] outline-none placeholder:text-[#7a675c]"
            />
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <VoiceInput
                lang={sourceLang}
                value={text}
                maxLength={MAX_TEXT_LENGTH}
                onChange={setText}
              />
              <div className="h-[3px] min-w-[4rem] flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-copper/80" style={{ width: `${used}%` }} />
              </div>
              {!LIVE_TRANSLATE && (
                <button
                  type="button"
                  onClick={() => runTranslate()}
                  disabled={!text.trim() || loading}
                  className="go-btn shrink-0 rounded-full px-5 py-2 font-display text-sm font-semibold tracking-wide disabled:cursor-not-allowed"
                >
                  {loading ? "Working" : "Render"}
                </button>
              )}
            </div>
          </article>

          <div className="relative z-30 mx-auto -my-2 flex items-center justify-center md:col-start-2 md:row-start-1 md:my-0 md:mt-28 md:h-auto md:self-start">
            <button
              type="button"
              onClick={swap}
              className="lens flex h-14 w-14 items-center justify-center rounded-full border border-white/25 text-copper"
              aria-label="Swap languages"
            >
              <motion.span animate={{ rotate: swapSpin * 180 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M7 8h11M7 8l3-3M7 8l3 3M17 16H6m11 0l-3-3m3 3l-3 3"
                  />
                </svg>
              </motion.span>
            </button>
          </div>

          <article className="glass plate-out relative z-[11] mt-2 flex min-h-[460px] flex-col p-5 sm:p-7 md:col-start-2 md:col-end-4 md:row-start-1 md:ml-8 md:mt-14">
            <div className="mb-5 flex items-center justify-between gap-3">
              <span className="font-display text-sm tracking-wide text-ice/80">render</span>
              {sourceLang === "auto" && detectedMeta && (
                <span className="rounded-full border border-ice/30 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ice">
                  heard as {detectedMeta.name}
                </span>
              )}
            </div>
            <LanguageSelect label="Read in" value={targetLang} onChange={setTargetLang} excludeAuto />

            <div className="relative mt-6 min-h-[230px] flex-1">
              {loading && (
                <div className="space-y-3 pt-1" aria-hidden>
                  <div className="h-4 w-11/12 animate-pulse rounded-full bg-white/10" />
                  <div className="h-4 w-8/12 animate-pulse rounded-full bg-white/10" />
                  <div className="h-4 w-9/12 animate-pulse rounded-full bg-white/10" />
                </div>
              )}

              {!loading && error && <p className="text-sm leading-6 text-[#f0b4a4]">{error}</p>}

              {!loading && !error && !output && (
                <div>
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f7d72]">
                    start with one of these
                  </p>
                  <div className="flex flex-col gap-2">
                    {EXAMPLES.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => {
                          setText(example);
                          if (!LIVE_TRANSLATE) runTranslate(example);
                        }}
                        className="ghost-btn rounded-2xl px-3 py-2.5 text-left text-sm text-[#e8d5c4] transition"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!loading && !error && output && (
                <AnimatePresence mode="wait">
                  <motion.p
                    key={output}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-pre-wrap text-[1.15rem] leading-8 text-[#f7ece1]"
                  >
                    {output}
                  </motion.p>
                </AnimatePresence>
              )}
            </div>

            <div className="mt-5 flex items-center gap-2">
              <CopyButton text={output} />
              <SpeakButton text={output} lang={targetLang} />
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
