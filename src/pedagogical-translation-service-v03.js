"use strict";

require("dotenv").config();

const Groq = require("groq-sdk");

const SUPPORTED_LANGUAGES = new Set(["fr", "en"]);

function validateLanguage(language) {
  if (!SUPPORTED_LANGUAGES.has(language)) {
    throw new Error(`Langue non supportee : ${language}`);
  }
}

async function translatePedagogicalText({
  text,
  sourceLanguage = "fr",
  targetLanguage = "en"
}) {
  if (typeof text !== "string") {
    throw new TypeError("Le texte doit etre une chaine.");
  }

  validateLanguage(sourceLanguage);
  validateLanguage(targetLanguage);

  const original = text;

  if (!original.trim() || sourceLanguage === targetLanguage) {
    return {
      original,
      translated: original,
      sourceLanguage,
      targetLanguage,
      translatedBy: "none"
    };
  }

  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.LLM_MODEL || "openai/gpt-oss-120b";

  if (!apiKey) {
    throw new Error("GROQ_API_KEY absente.");
  }

  const client = new Groq({ apiKey, timeout: 15000, maxRetries: 0 });

  const languages = {
    fr: "French",
    en: "English"
  };

  const response = await client.chat.completions.create({
    model,
    temperature: 0,
    max_completion_tokens: 500,
    messages: [
      {
        role: "system",
        content:
          `Translate educational text from ${languages[sourceLanguage]} ` +
          `to ${languages[targetLanguage]}. ` +
          "Preserve names, identifiers, numbers and meaning. " +
          "Do not add interpretations or recommendations. " +
          "Return only the translation."
      },
      {
        role: "user",
        content: original
      }
    ]
  });

  const translated =
    response.choices?.[0]?.message?.content?.trim();

  if (!translated) {
    throw new Error("Traduction vide.");
  }

  return {
    original,
    translated,
    sourceLanguage,
    targetLanguage,
    translatedBy: "groq",
    model
  };
}

const translationCacheV03 = new Map();
const CACHE_MAX_V03 = 100;
const CACHE_TTL_MS_V03 = 15 * 60 * 1000;

async function translatePedagogicalBatch({
  texts,
  sourceLanguage = "fr",
  targetLanguage = "en",
  translateOne = translatePedagogicalText
}) {
  if (!Array.isArray(texts) || texts.length < 1 || texts.length > 10) {
    throw new TypeError("Le lot doit contenir entre 1 et 10 textes.");
  }

  validateLanguage(sourceLanguage);
  validateLanguage(targetLanguage);

  if (typeof translateOne !== "function") {
    throw new TypeError("Moteur de traduction invalide.");
  }

  for (const text of texts) {
    if (typeof text !== "string" || text.length > 1000) {
      throw new TypeError("Texte invalide ou trop long.");
    }
  }

  const results = [];

  for (const original of texts) {
    if (!original.trim() || sourceLanguage === targetLanguage) {
      results.push({
        original,
        translated: original,
        sourceLanguage,
        targetLanguage,
        translatedBy: "none"
      });
      continue;
    }

    const key = JSON.stringify([
      sourceLanguage,
      targetLanguage,
      original
    ]);

    const cached = translationCacheV03.get(key);

    if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS_V03) {
      results.push({
        ...cached.result,
        translatedBy: "cache"
      });
      continue;
    }

    if (cached) {
      translationCacheV03.delete(key);
    }

    const result = await translateOne({
      text: original,
      sourceLanguage,
      targetLanguage
    });

    if (
      !result ||
      typeof result.translated !== "string" ||
      !result.translated.trim()
    ) {
      throw new Error("Resultat de traduction invalide.");
    }

    const safeResult = {
      ...result,
      original,
      sourceLanguage,
      targetLanguage
    };

    if (translationCacheV03.size >= CACHE_MAX_V03) {
      const oldestKey = translationCacheV03.keys().next().value;
      translationCacheV03.delete(oldestKey);
    }

    translationCacheV03.set(key, {
      result: safeResult,
      createdAt: Date.now()
    });

    results.push({ ...safeResult });
  }

  return results;
}

module.exports = {
  translatePedagogicalText,
  translatePedagogicalBatch
};