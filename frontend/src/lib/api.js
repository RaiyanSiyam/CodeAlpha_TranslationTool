export async function translate({ text, sourceLang, targetLang }) {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, sourceLang, targetLang }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Translation failed.");
    error.code = data.code || "PROVIDER_DOWN";
    throw error;
  }

  return data;
}

export function errorCopy(code) {
  switch (code) {
    case "RATE_LIMITED":
      return "The translator is catching its breath — too many requests. Try again in a few seconds.";
    case "UNSUPPORTED_LANGUAGE":
      return "That language pair isn’t available on this provider. Pick another pair and retry.";
    case "VALIDATION":
      return "Add some text (under 2000 characters) before translating.";
    default:
      return "The translation service is unreachable right now. Check the backend and try again.";
  }
}
