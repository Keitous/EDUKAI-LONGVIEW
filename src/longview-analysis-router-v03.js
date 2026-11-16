"use strict";

const express = require("express");
const {
  requireTrustedWriteOrigin
} = require("./v03-write-origin-guard");

const {
  canTeacherAccessAssignedLearner
} = require("./pedagogical-assignment-access-v03");

const {
  getLearnerById
} = require("./data/learner-store-v03");

const {
  runLLMAgent
} = require("./llm-agent");

function createLongViewAnalysisRouterV03() {
  const router = express.Router();

  router.post("/longview/analyze", requireTrustedWriteOrigin, async (req, res, next) => {
    try {
      const auth = req.session?.auth;

      if (
        auth?.verifiedByServer !== true ||
        auth?.role !== "enseignant" ||
        !Number.isSafeInteger(auth?.id_enseignant) ||
        auth.id_enseignant <= 0
      ) {
        return res.status(401).json({
          success: false,
          error: "Authentification enseignant requise."
        });
      }

      if (
        !["nairobi_reset_test", "nairobi_cloud"].includes(
          process.env.EDUKAI_V03_MODE
        )
      ) {
        return res.status(503).json({
          success: false,
          error: "Mode Nairobi non autorise."
        });
      }

      const learnerId = String(req.body?.learnerId || "").trim();
      const question = String(req.body?.question || "").trim();
      const language = String(req.body?.language || "fr")
        .trim()
        .toLowerCase();

      if (
        !learnerId ||
        !question ||
        question.length > 4000 ||
        !["fr", "en"].includes(language)
      ) {
        return res.status(400).json({
          success: false,
          error: "Parametres d'analyse invalides."
        });
      }

      const allowed = await canTeacherAccessAssignedLearner(
        auth.id_enseignant,
        learnerId
      );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: "Acces a cet apprenant non autorise."
        });
      }

      const learner = await getLearnerById(learnerId);

      if (!learner) {
        return res.status(404).json({
          success: false,
          error: "Apprenant introuvable."
        });
      }

      const instruction = language === "en"
        ? "Respond in English."
        : "Reponds en francais.";

      const agentQuestion = [
        question,
        "",
        "Selected learner ID: " + learnerId,
        "Use only evidence associated with this learner.",
        "Distinguish observed facts from interpretations.",
        "Do not invent causal explanations.",
        "Do not approve, modify or reject teacher decisions.",
        instruction
      ].join("\n");

      const analysis = await runLLMAgent(agentQuestion, {
        mode: "nairobi_v03"
      });

      return res.json({
        success: true,
        learner: {
          id: learner.id,
          name: learner.name
        },
        analysis,
        language,
        humanReviewRequired: true,
        consequentialActionExecuted: false,
        syntheticData: true
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = {
  createLongViewAnalysisRouterV03
};