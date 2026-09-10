import { useEffect, useMemo, useRef, useState } from "react";
import { LANGUAGES } from "../lib/languages.js";

export default function LanguageSelect({ value, onChange, excludeAuto = false, label }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const options = useMemo(() => {
    const list = excludeAuto ? LANGUAGES.filter((item) => item.code !== "auto") : LANGUAGES;
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.native.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q)
    );
  }, [excludeAuto, query]);

  const selected = LANGUAGES.find((item) => item.code === value) || LANGUAGES[1];

  useEffect(() => {
    function onDoc(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-copper/80">{label}</p>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="ghost-btn flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-sm text-ice">
          {selected.sample}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-[#f6eadc]">{selected.name}</span>
          <span className="block truncate font-mono text-[11px] text-[#cbb8a8]">{selected.native}</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#8f7d72]">{selected.code}</span>
      </button>

      {open && (
        <div className="glass absolute z-30 mt-2 w-full overflow-hidden rounded-2xl">
          <div className="border-b border-white/10 p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by name or code"
              className="w-full rounded-xl bg-black/30 px-3 py-2 font-mono text-sm text-[#f6eadc] outline-none ring-1 ring-white/10 placeholder:text-[#7d6b62] focus:ring-copper/50"
            />
          </div>
          <ul className="no-scrollbar max-h-64 overflow-y-auto p-1" role="listbox">
            {options.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-[#8f7d72]">Nothing matches</li>
            )}
            {options.map((item) => (
              <li key={item.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={item.code === value}
                  onClick={() => {
                    onChange(item.code);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${
                    item.code === value ? "bg-white/10" : "hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-xs text-ice">
                    {item.sample}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-[#f6eadc]">{item.name}</span>
                    <span className="block truncate text-[11px] text-[#cbb8a8]">{item.native}</span>
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#8f7d72]">{item.code}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
