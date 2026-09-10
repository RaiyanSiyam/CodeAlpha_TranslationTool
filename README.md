# calque

CodeAlpha Task 1. A translator with a React UI and an Express proxy so the provider key never reaches the browser.

**calque** is a linguistics term: a word-for-word loan translation. The app does the same job — take text in one language, return it in another.

## Run

Node 18+. Two terminals:

```bash
cd backend
copy .env.example .env    # Windows; on macOS/Linux: cp .env.example .env
npm install
npm run dev               # http://localhost:3001
```

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173  (proxies /api → :3001)
```

Open `http://localhost:5173`. Type or **Speak**, pick languages, click **Render**.

## API

`POST /api/translate`

```json
{ "text": "Hello world", "sourceLang": "en", "targetLang": "es" }
```

Success:

```json
{ "translatedText": "Hola mundo", "detectedSourceLang": "en" }
```

`detectedSourceLang` is present when the provider reports it (including auto-detect).

Rules enforced on the server:

- `text` required, max **2000** characters (same cap in the UI)
- `sourceLang` / `targetLang` required
- If source equals target (and source is not `auto`), the API **does not** call the provider; it echoes `text` and sets `skipped: true`

Error body: `{ "code", "message" }`

| `code` | Typical HTTP | Meaning |
| --- | --- | --- |
| `VALIDATION` | 400 | Empty text, over-length, or bad JSON |
| `UNSUPPORTED_LANGUAGE` | 400 | Pair the provider will not handle |
| `RATE_LIMITED` | 429 | Provider quota / throttle |
| `PROVIDER_DOWN` | 502/500 | Network failure, HTML instead of JSON, unknown provider |

PowerShell-safe check (avoids `curl` quoting issues):

```bash
node --input-type=module -e "const r=await fetch('http://localhost:3001/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Hello world',sourceLang:'en',targetLang:'es'})}); console.log(await r.text())"
```

## Provider

All outbound calls go through `translateText(text, sourceLang, targetLang)` in `backend/src/translateService.js`. Change `TRANSLATE_PROVIDER` in `backend/.env` and restart the backend.

| Value | Credentials |
| --- | --- |
| `libretranslate` (default) | `LIBRETRANSLATE_URL` (repo default: `https://translate.bark.lgbt`). Optional `LIBRETRANSLATE_API_KEY`. `libretranslate.com` itself requires a key. If the configured URL fails, the service tries a fallback public instance. |
| `mymemory` | None. [MyMemory](https://mymemory.translated.net/doc/spec.php) free daily quota. |
| `google` | `GOOGLE_TRANSLATE_API_KEY` — [Cloud Translation setup](https://cloud.google.com/translate/docs/setup) |
| `azure` | `AZURE_TRANSLATOR_KEY` + `AZURE_TRANSLATOR_REGION`. Optional `AZURE_TRANSLATOR_ENDPOINT`. [Translator](https://learn.microsoft.com/azure/ai-services/translator/) F0 tier exists. |

Self-host LibreTranslate: [Docker instructions](https://github.com/LibreTranslate/LibreTranslate#install), then point `LIBRETRANSLATE_URL` at that host.

## Frontend notes

- Vite proxies `/api` to port 3001 (`frontend/vite.config.js`).
- Debounced live translate: set `LIVE_TRANSLATE` to `true` in `frontend/src/config.js`. Default is an explicit **Render** button.
- Copy uses the clipboard API (checkmark, no `alert`).
- **Voice in:** `SpeechRecognition` / `webkitSpeechRecognition` on the source plate (Chrome/Edge). Hidden if the API is missing. Uses the selected source locale, or the browser language when source is auto-detect. Click again to stop. Mic errors show inline (permission, no speech) — no `alert()`.
- **Voice out:** `SpeechSynthesisUtterance` on the render plate. Hidden if there is no matching voice.

## Repo

```
backend/src/server.js             POST /api/translate, /health
backend/src/translateService.js   provider implementations
backend/.env.example              env template (gitignored: .env)
frontend/src/App.jsx               UI
```

## LinkedIn clip (45s)

1. **0–7s** — Screen: calque UI. One line: “CodeAlpha Task 1 — translator, key on the server.”
2. **7–22s** — Click **Speak**, dictate a line (or type), pick a target language, hit **Render**.
3. **22–34s** — Copy (checkmark). **Read** the output. Swap source/target.
4. **32–45s** — Cut to `translateService.js` + `POST /api/translate`. End on the GitHub name `CodeAlpha_TranslationTool`.
