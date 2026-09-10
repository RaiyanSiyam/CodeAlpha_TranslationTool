import { ErrorCode, TranslationError, mapProviderError } from "./errors.js";

function timeoutSignal(ms = 15000) {
  return AbortSignal.timeout(ms);
}

function libretranslateBases() {
  const configured = process.env.LIBRETRANSLATE_URL;
  const defaults = [
    "https://translate.bark.lgbt",
    "https://libretranslate.de",
  ];
  return [...new Set([configured, ...defaults].filter(Boolean).map((url) => url.replace(/\/$/, "")))];
}

async function translateLibreTranslate(text, sourceLang, targetLang) {
  const payload = {
    q: text,
    source: sourceLang === "auto" ? "auto" : sourceLang,
    target: targetLang,
    format: "text",
  };

  if (process.env.LIBRETRANSLATE_API_KEY) {
    payload.api_key = process.env.LIBRETRANSLATE_API_KEY;
  }

  let lastError;

  for (const base of libretranslateBases()) {
    let response;
    try {
      response = await fetch(`${base}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        signal: timeoutSignal(),
      });
    } catch {
      lastError = new TranslationError(
        ErrorCode.PROVIDER_DOWN,
        "Could not reach the LibreTranslate instance.",
        502
      );
      continue;
    }

    const raw = await response.text();
    if (raw.trimStart().startsWith("<")) {
      lastError = new TranslationError(
        ErrorCode.PROVIDER_DOWN,
        "LibreTranslate returned a non-API response.",
        502
      );
      continue;
    }

    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      lastError = new TranslationError(
        ErrorCode.PROVIDER_DOWN,
        "LibreTranslate returned an unexpected response.",
        502
      );
      continue;
    }

    if (!response.ok) {
      lastError = mapProviderError(response.status, data.error || raw);
      if (lastError.code === ErrorCode.UNSUPPORTED_LANGUAGE) {
        throw lastError;
      }
      continue;
    }

    const translatedText = data.translatedText;
    if (typeof translatedText !== "string") {
      lastError = new TranslationError(
        ErrorCode.PROVIDER_DOWN,
        "LibreTranslate returned an unexpected response.",
        502
      );
      continue;
    }

    const detected =
      data.detectedLanguage?.language || data.detectedLanguage || undefined;

    return {
      translatedText,
      detectedSourceLang: typeof detected === "string" ? detected : undefined,
    };
  }

  throw (
    lastError ||
    new TranslationError(
      ErrorCode.PROVIDER_DOWN,
      "The translation provider is unavailable. Try again shortly.",
      502
    )
  );
}

async function translateGoogle(text, sourceLang, targetLang) {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) {
    throw new TranslationError(
      ErrorCode.PROVIDER_DOWN,
      "GOOGLE_TRANSLATE_API_KEY is not set.",
      500
    );
  }

  const params = new URLSearchParams({
    q: text,
    target: targetLang,
    format: "text",
    key,
  });
  if (sourceLang && sourceLang !== "auto") {
    params.set("source", sourceLang);
  }

  let response;
  try {
    response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?${params}`,
      { method: "POST", signal: timeoutSignal() }
    );
  } catch {
    throw new TranslationError(
      ErrorCode.PROVIDER_DOWN,
      "Could not reach Google Cloud Translation.",
      502
    );
  }

  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { error: { message: raw } };
  }

  if (!response.ok) {
    throw mapProviderError(response.status, data.error?.message || raw);
  }

  const translation = data.data?.translations?.[0];
  if (!translation?.translatedText) {
    throw new TranslationError(
      ErrorCode.PROVIDER_DOWN,
      "Google Cloud Translation returned an unexpected response.",
      502
    );
  }

  return {
    translatedText: translation.translatedText,
    detectedSourceLang: translation.detectedSourceLanguage,
  };
}

async function translateAzure(text, sourceLang, targetLang) {
  const key = process.env.AZURE_TRANSLATOR_KEY;
  const region = process.env.AZURE_TRANSLATOR_REGION;
  const endpoint = (
    process.env.AZURE_TRANSLATOR_ENDPOINT ||
    "https://api.cognitive.microsofttranslator.com"
  ).replace(/\/$/, "");

  if (!key) {
    throw new TranslationError(
      ErrorCode.PROVIDER_DOWN,
      "AZURE_TRANSLATOR_KEY is not set.",
      500
    );
  }

  const query = new URLSearchParams({
    "api-version": "3.0",
    to: targetLang,
  });
  if (sourceLang && sourceLang !== "auto") {
    query.set("from", sourceLang);
  }

  const headers = {
    "Content-Type": "application/json",
    "Ocp-Apim-Subscription-Key": key,
  };
  if (region) {
    headers["Ocp-Apim-Subscription-Region"] = region;
  }

  let response;
  try {
    response = await fetch(`${endpoint}/translate?${query}`, {
      method: "POST",
      headers,
      body: JSON.stringify([{ Text: text }]),
      signal: timeoutSignal(),
    });
  } catch {
    throw new TranslationError(
      ErrorCode.PROVIDER_DOWN,
      "Could not reach Microsoft Translator.",
      502
    );
  }

  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : [];
  } catch {
    data = { error: { message: raw } };
  }

  if (!response.ok) {
    throw mapProviderError(response.status, data.error?.message || raw);
  }

  const item = Array.isArray(data) ? data[0] : null;
  const translatedText = item?.translations?.[0]?.text;
  if (typeof translatedText !== "string") {
    throw new TranslationError(
      ErrorCode.PROVIDER_DOWN,
      "Microsoft Translator returned an unexpected response.",
      502
    );
  }

  return {
    translatedText,
    detectedSourceLang: item?.detectedLanguage?.language,
  };
}

async function translateMyMemory(text, sourceLang, targetLang) {
  const pair = `${sourceLang === "auto" ? "autodetect" : sourceLang}|${targetLang}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(pair)}`;

  let response;
  try {
    response = await fetch(url, { signal: timeoutSignal() });
  } catch {
    throw new TranslationError(
      ErrorCode.PROVIDER_DOWN,
      "Could not reach MyMemory Translation.",
      502
    );
  }

  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new TranslationError(
      ErrorCode.PROVIDER_DOWN,
      "MyMemory returned an unexpected response.",
      502
    );
  }

  if (!response.ok || data.responseStatus === 429) {
    throw mapProviderError(response.status === 200 ? 429 : response.status, raw);
  }

  const translatedText = data.responseData?.translatedText;
  if (typeof translatedText !== "string") {
    throw mapProviderError(400, data.responseDetails || raw);
  }

  const detected =
    data.responseData?.detectedLanguage ||
    data.detectedLanguage ||
    undefined;

  return {
    translatedText,
    detectedSourceLang: typeof detected === "string" ? detected : undefined,
  };
}

const providers = {
  libretranslate: translateLibreTranslate,
  mymemory: translateMyMemory,
  google: translateGoogle,
  azure: translateAzure,
};

/**
 * Provider-agnostic translation entry point.
 * Swap providers with TRANSLATE_PROVIDER — do not call APIs from the frontend.
 */
export async function translateText(text, sourceLang, targetLang) {
  const name = (process.env.TRANSLATE_PROVIDER || "libretranslate").toLowerCase();
  const fn = providers[name];

  if (!fn) {
    throw new TranslationError(
      ErrorCode.PROVIDER_DOWN,
      `Unknown TRANSLATE_PROVIDER "${name}". Use libretranslate, mymemory, google, or azure.`,
      500
    );
  }

  return fn(text, sourceLang, targetLang);
}
