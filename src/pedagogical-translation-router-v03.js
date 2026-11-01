"use strict";

const express = require("express");
const { rateLimit } = require("express-rate-limit");

const {
  translatePedagogicalText
} = require("./pedagogical-translation-service-v03");

function createPedagogicalTranslationRouter(
  requireAuthenticatedTeacher,
  requireTrustedWriteOrigin
) {
  if (
    typeof requireAuthenticatedTeacher !== "function" ||
    typeof requireTrustedWriteOrigin !== "function"
  ) {
    throw new TypeError(
      "Middlewares de securite obligatoires."
    );
  }

  const router = express.Router();

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: "Limite de traduction atteinte."
    }
  });

  router.post(
    "/translate",
    requireAuthenticatedTeacher,
    requireTrustedWriteOrigin,
    limiter,
    async (req, res) => {
      const body = req.body || {};

      if (
        typeof body.text !== "string" ||
        !body.text.trim() ||
        body.text.length > 1000 ||
        !["fr", "en"].includes(body.sourceLanguage) ||
        !["fr", "en"].includes(body.targetLanguage)
      ) {
        return res.status(400).json({
          error: "Parametres de traduction invalides."
        });
      }

      // Mode demonstration uniquement :
      // aucun commentaire reel ni contenu libre n'est transmis.
      const allowedDemoTexts = new Set([
        "L'enseignant recommande trois exercices de mathematiques par semaine.",
        "The teacher recommends a weekly mathematics review session."
      ]);

      if (!allowedDemoTexts.has(body.text)) {
        return res.status(403).json({
          error: "Traduction limitee aux textes de demonstration."
        });
      }

      try {
        const result = await translatePedagogicalText({
          text: body.text,
          sourceLanguage: body.sourceLanguage,
          targetLanguage: body.targetLanguage
        });

        return res.status(200).json({
          success: true,
          ...result,
          syntheticData: true
        });
      } catch (error) {
        console.error(
          "Erreur traduction EDUKAI :",
          error.status || error.code || "Erreur"
        );

        return res.status(503).json({
          error: "Service de traduction temporairement indisponible."
        });
      }
    }
  );

  return router;
}

module.exports = {
  createPedagogicalTranslationRouter
};