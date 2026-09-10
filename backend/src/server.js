import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { ErrorCode, MAX_TEXT_LENGTH, TranslationError } from "./errors.js";
import { translateText } from "./translateService.js";

dotenv.config({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env"),
});

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: "32kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, provider: process.env.TRANSLATE_PROVIDER || "libretranslate" });
});

app.post("/api/translate", async (req, res, next) => {
  try {
    const { text, sourceLang, targetLang } = req.body ?? {};

    if (typeof text !== "string" || !text.trim()) {
      throw new TranslationError(
        ErrorCode.VALIDATION,
        "Text is required.",
        400
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      throw new TranslationError(
        ErrorCode.VALIDATION,
        `Text must be ${MAX_TEXT_LENGTH} characters or fewer.`,
        400
      );
    }

    if (typeof sourceLang !== "string" || !sourceLang.trim()) {
      throw new TranslationError(
        ErrorCode.VALIDATION,
        "sourceLang is required.",
        400
      );
    }

    if (typeof targetLang !== "string" || !targetLang.trim()) {
      throw new TranslationError(
        ErrorCode.VALIDATION,
        "targetLang is required.",
        400
      );
    }

    const trimmed = text.trim();
    const source = sourceLang.trim();
    const target = targetLang.trim();

    if (source !== "auto" && source === target) {
      return res.json({
        translatedText: trimmed,
        detectedSourceLang: source,
        skipped: true,
      });
    }

    const result = await translateText(trimmed, source, target);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof TranslationError) {
    return res.status(error.status).json({
      code: error.code,
      message: error.message,
    });
  }

  if (error.type === "entity.parse.failed" || error instanceof SyntaxError) {
    return res.status(400).json({
      code: ErrorCode.VALIDATION,
      message: "Request body must be valid JSON.",
    });
  }

  console.error(error);
  res.status(500).json({
    code: ErrorCode.PROVIDER_DOWN,
    message: "Unexpected server error.",
  });
});

app.listen(port, () => {
  console.log(`Translation proxy listening on http://localhost:${port}`);
});
