export const MAX_TEXT_LENGTH = 2000;

export const ErrorCode = {
  VALIDATION: "VALIDATION",
  RATE_LIMITED: "RATE_LIMITED",
  UNSUPPORTED_LANGUAGE: "UNSUPPORTED_LANGUAGE",
  PROVIDER_DOWN: "PROVIDER_DOWN",
};

export class TranslationError extends Error {
  constructor(code, message, status = 502) {
    super(message);
    this.name = "TranslationError";
    this.code = code;
    this.status = status;
  }
}

export function mapProviderError(status, bodyText = "") {
  const lower = String(bodyText).toLowerCase();

  if (status === 429) {
    return new TranslationError(
      ErrorCode.RATE_LIMITED,
      "The translation provider is rate-limited. Wait a moment and try again.",
      429
    );
  }

  if (
    status === 400 ||
    status === 422 ||
    lower.includes("not supported") ||
    lower.includes("unsupported") ||
    lower.includes("invalid target") ||
    lower.includes("invalid source")
  ) {
    return new TranslationError(
      ErrorCode.UNSUPPORTED_LANGUAGE,
      "That language pair is not supported by the current provider.",
      400
    );
  }

  return new TranslationError(
    ErrorCode.PROVIDER_DOWN,
    "The translation provider is unavailable. Try again shortly.",
    502
  );
}
