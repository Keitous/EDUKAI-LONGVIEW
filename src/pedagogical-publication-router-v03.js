"use strict";

const express = require("express");

const {
  publishLearnerRecommendations
} = require("./pedagogical-workflow-v03");

const {
  canTeacherAccessAssignedLearner
} = require("./pedagogical-assignment-access-v03");

function createPedagogicalPublicationRouter(
  requireAuthenticatedTeacher
) {
  if (typeof requireAuthenticatedTeacher !== "function") {
    throw new TypeError(
      "Middleware d'authentification requis."
    );
  }

  const router = express.Router();

  router.post(
    "/learners/:id/publish",
    requireAuthenticatedTeacher,
    async (req, res, next) => {
      try {
        const learnerId = req.params.id;

        if (!/^LRN[0-9]{3,10}$/.test(learnerId)) {
          return res.status(400).json({
            error: "Identifiant apprenant invalide."
          });
        }

        const auth = req.session?.auth;

        if (
          !auth ||
          auth.verifiedByServer !== true ||
          auth.role !== "enseignant" ||
          !Number.isSafeInteger(auth.id_enseignant) ||
          auth.id_enseignant <= 0
        ) {
          return res.status(403).json({
            error: "Enseignant non autorise."
          });
        }

        if (
          !(await canTeacherAccessAssignedLearner(
            auth.id_enseignant,
            learnerId
          ))
        ) {
          return res.status(403).json({
            error: "Acces pedagogique non autorise."
          });
        }

        const result =
          await publishLearnerRecommendations(learnerId);

        if (!result) {
          return res.status(404).json({
            error: "Apprenant introuvable."
          });
        }

        if (result.status === "no_recommendation") {
          return res.status(200).json(result);
        }

        return res.status(result.reused ? 200 : 201).json({
          ...result,
          publishedBy: auth.id_enseignant
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

module.exports = {
  createPedagogicalPublicationRouter
};