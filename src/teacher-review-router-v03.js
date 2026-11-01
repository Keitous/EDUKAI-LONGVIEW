"use strict";

const express = require("express");

const {
  submitPedagogicalReview
} = require("./db/teacher-review-transaction");

const {
  requireRecommendationReviewAccess
} = require("./pedagogical-review-access-v03");

function createTeacherReviewRouter(
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

  router.post(
    "/recommendations/:id/review",
    requireAuthenticatedTeacher,
    requireTrustedWriteOrigin,
    requireRecommendationReviewAccess,
    async (req, res, next) => {
      try {
        const recommendationId = req.params.id;
        const auth = req.session?.auth;
        const body = req.body || {};

        if (!/^[1-9][0-9]*$/.test(recommendationId)) {
          return res.status(400).json({
            error: "Identifiant recommandation invalide."
          });
        }

        if (
          !Number.isSafeInteger(auth?.id_enseignant) ||
          auth.id_enseignant <= 0
        ) {
          return res.status(403).json({
            error: "Identite enseignant invalide."
          });
        }

        const allowedDecisions = [
          "approuvee",
          "modifiee",
          "rejetee"
        ];

        if (!allowedDecisions.includes(body.decision)) {
          return res.status(400).json({
            error: "Decision pedagogique invalide."
          });
        }

        if (
          body.commentaire !== undefined &&
          (
            typeof body.commentaire !== "string" ||
            body.commentaire.length > 2000
          )
        ) {
          return res.status(400).json({
            error: "Commentaire invalide."
          });
        }

        if (
          body.contenu_modifie !== undefined &&
          (
            typeof body.contenu_modifie !== "string" ||
            body.contenu_modifie.length > 5000
          )
        ) {
          return res.status(400).json({
            error: "Contenu modifie invalide."
          });
        }

        if (
          body.decision === "modifiee" &&
          (
            typeof body.contenu_modifie !== "string" ||
            body.contenu_modifie.trim() === ""
          )
        ) {
          return res.status(400).json({
            error: "Contenu corrige obligatoire."
          });
        }

        const result = await submitPedagogicalReview({
          id_recommandation: recommendationId,
          id_enseignant: auth.id_enseignant,
          decision: body.decision,
          commentaire: body.commentaire ?? null,
          contenu_modifie: body.contenu_modifie ?? null
        });

        return res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

module.exports = {
  createTeacherReviewRouter
};