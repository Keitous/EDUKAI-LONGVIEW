"use strict";

const {
  pool
} = require("./db/postgres-pedagogical-v03");

const {
  canTeacherAccessLearner
} = require("./pedagogical-access-v03");

async function requireRecommendationReviewAccess(
  req,
  res,
  next
) {
  try {
    const teacherId = req.session?.auth?.id_enseignant;
    const recommendationId = req.params.id;

    if (
      typeof recommendationId !== "string" ||
      !/^[1-9][0-9]*$/.test(recommendationId) ||
      BigInt(recommendationId) > 9223372036854775807n
    ) {
      return res.status(400).json({
        error: "Identifiant recommandation invalide."
      });
    }

    if (
      !Number.isSafeInteger(teacherId) ||
      teacherId <= 0
    ) {
      return res.status(403).json({
        error: "Enseignant non autorise."
      });
    }

    const result = await pool.query(
      `SELECT a.id_apprenant
       FROM edukai.recommandation r
       JOIN edukai.analyse_longitudinale a
         ON a.id_analyse = r.id_analyse
       WHERE r.id_recommandation = $1`,
      [recommendationId]
    );

    if (result.rowCount !== 1) {
      return res.status(404).json({
        error: "Recommandation introuvable."
      });
    }

    const learnerId = result.rows[0].id_apprenant;

    if (!canTeacherAccessLearner(teacherId, learnerId)) {
      return res.status(403).json({
        error: "Acces pedagogique non autorise."
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requireRecommendationReviewAccess
};