"use strict";

const express = require("express");

const {
  pool
} = require("./db/postgres-pedagogical-v03");

const {
  canTeacherAccessLearner
} = require("./pedagogical-access-v03");

function createPedagogicalHistoryRouter(
  requireAuthenticatedTeacher
) {
  if (typeof requireAuthenticatedTeacher !== "function") {
    throw new TypeError(
      "Authentification enseignant obligatoire."
    );
  }

  const router = express.Router();

  router.get(
    "/learners/:id/review-history",
    requireAuthenticatedTeacher,
    async (req, res, next) => {
      try {
        const learnerId = req.params.id;
        const teacherId = req.session?.auth?.id_enseignant;

        if (!/^LRN[0-9]{3,10}$/.test(learnerId)) {
          return res.status(400).json({
            error: "Identifiant apprenant invalide."
          });
        }

        if (!canTeacherAccessLearner(teacherId, learnerId)) {
          return res.status(403).json({
            error: "Acces pedagogique non autorise."
          });
        }

        const result = await pool.query(
          `SELECT
             a.id_analyse,
             a.periode_debut,
             a.periode_fin,
             a.date_analyse,
             r.id_recommandation,
             r.contenu,
             r.justification,
             r.priorite,
             r.statut,
             r.date_creation,
             v.id_validation,
             v.id_enseignant,
             v.decision,
             v.commentaire,
             v.contenu_modifie,
             v.date_validation
           FROM edukai.analyse_longitudinale a
           JOIN edukai.recommandation r
             ON r.id_analyse = a.id_analyse
           LEFT JOIN edukai.validation_enseignant v
             ON v.id_recommandation = r.id_recommandation
           WHERE a.id_apprenant = $1
           ORDER BY
             r.date_creation DESC,
             r.id_recommandation DESC,
             v.date_validation DESC`,
          [learnerId]
        );

        return res.status(200).json({
          success: true,
          learnerId,
          count: result.rowCount,
          history: result.rows,
          syntheticData: true
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

module.exports = {
  createPedagogicalHistoryRouter
};