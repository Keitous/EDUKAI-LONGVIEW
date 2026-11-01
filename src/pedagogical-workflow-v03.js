"use strict";

const {
  analyzeLearner
} = require("./longitudinal-service-v03");

const {
  buildRecommendations
} = require("./pedagogical-recommendation-service-v03");

const {
  publishPedagogicalAnalysis
} = require("./db/pedagogical-publication-v03");

async function prepareLearnerPublication(learnerId) {
  if (
    typeof learnerId !== "string" ||
    !/^LRN[0-9]{3,10}$/.test(learnerId)
  ) {
    throw new Error("Identifiant apprenant invalide.");
  }

  const analysis = await analyzeLearner(learnerId);

  if (!analysis) {
    return null;
  }

  const recommendationResult =
    buildRecommendations(analysis);

  if (
    !recommendationResult ||
    !Array.isArray(recommendationResult)
  ) {
    throw new Error(
      "Resultat des recommandations invalide."
    );
  }

  return {
    analysis,
    recommendations:
      recommendationResult
  };
}

async function publishLearnerRecommendations(learnerId) {
  const prepared = await prepareLearnerPublication(learnerId);

  if (!prepared) {
    return null;
  }

  if (prepared.recommendations.length === 0) {
    return {
      success: false,
      learnerId,
      status: "no_recommendation",
      message: "Aucune recommandation a publier."
    };
  }

  return publishPedagogicalAnalysis(prepared);
}

module.exports = {
  prepareLearnerPublication,
  publishLearnerRecommendations
};