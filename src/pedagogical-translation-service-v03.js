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

module.exports = {
  translatePedagogicalText
};