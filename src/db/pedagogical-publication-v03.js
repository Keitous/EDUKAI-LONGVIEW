"use strict";

const {
  withV03Transaction
} = require("./pedagogical-review-repository");

const PRIORITY_MAP = Object.freeze({
  high: "elevee",
  monitoring: "normale",
  positive: "faible"
});

function requireObject(value, name) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new TypeError(`${name} doit etre un objet.`);
  }
}

function requireText(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} est obligatoire.`);
  }
  return value.trim();
}

async function publishPedagogicalAnalysis(data) {
  requireObject(data, "Donnees");

  const { analysis, recommendations } = data;

  requireObject(analysis, "Analyse");

  if (
    !Array.isArray(recommendations) ||
    recommendations.length === 0
  ) {
    throw new Error(
      "Au moins une recommandation est requise."
    );
  }

  const learnerId = requireText(
    analysis.learnerId,
    "Identifiant apprenant"
  );

  if (!/^LRN[0-9]{3,10}$/.test(learnerId)) {
    throw new Error("Format identifiant apprenant invalide.");
  }

  for (const recommendation of recommendations) {
    requireObject(recommendation, "Recommandation");

    requireText(recommendation.action, "Action");

    if (!Object.hasOwn(
      PRIORITY_MAP,
      recommendation.priority
    )) {
      throw new Error("Priorite non reconnue.");
    }
  }

  return withV03Transaction(async (client) => {
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [`edukai_v03_publication:${learnerId}`]
    );

    const existing = await client.query(
      `SELECT
         a.id_analyse,
         r.id_recommandation,
         r.priorite,
         r.statut
       FROM edukai.analyse_longitudinale a
       JOIN edukai.recommandation r
         ON r.id_analyse = a.id_analyse
       WHERE a.id_apprenant = $1
         AND a.periode_debut = $2
         AND a.periode_fin = $3
         AND a.version_agent = '0.3'
         AND a.modele_ia = 'explainable_rules_v03'
       ORDER BY a.id_analyse DESC, r.id_recommandation`,
      [
        learnerId,
        analysis.period?.from ?? null,
        analysis.period?.to ?? null
      ]
    );

    if (existing.rowCount > 0) {
      const analysisId = existing.rows[0].id_analyse;

      return {
        success: true,
        learnerId,
        analysisId,
        recommendations: existing.rows
          .filter(row => String(row.id_analyse) === String(analysisId))
          .map(row => ({
            id_recommandation: row.id_recommandation,
            priorite: row.priorite,
            statut: row.statut
          })),
        reused: true,
        status: "already_published"
      };
    }

    const analyseResult = await client.query(
      `INSERT INTO edukai.analyse_longitudinale
       (
         id_apprenant,
         periode_debut,
         periode_fin,
         tendances,
         indicateurs,
         sources,
         modele_ia,
         version_agent,
         statut
       )
       VALUES
       (
         $1, $2, $3,
         $4::jsonb,
         $5::jsonb,
         $6::jsonb,
         $7, $8, 'terminee'
       )
       RETURNING id_analyse`,
      [
        learnerId,
        analysis.period?.from ?? null,
        analysis.period?.to ?? null,
        JSON.stringify({
          subjects: analysis.subjects
        }),
        JSON.stringify({
          strongestImprovement:
            analysis.strongestImprovement ?? null,
          slowestImprovement:
            analysis.slowestImprovement ?? null,
          attendance:
            analysis.attendance ?? null
        }),
        JSON.stringify([]),
        "explainable_rules_v03",
        "0.3"
      ]
    );

    const analysisId = analyseResult.rows[0].id_analyse;
    const savedRecommendations = [];

    for (const recommendation of recommendations) {
      const result = await client.query(
        `INSERT INTO edukai.recommandation
         (
           id_analyse,
           contenu,
           justification,
           priorite,
           statut
         )
         VALUES ($1, $2, $3, $4, 'en_attente')
         RETURNING
           id_recommandation,
           priorite,
           statut`,
        [
          analysisId,
          recommendation.action.trim(),
          recommendation.observation ?? null,
          PRIORITY_MAP[recommendation.priority]
        ]
      );

      savedRecommendations.push(result.rows[0]);
    }

    return {
      success: true,
      learnerId,
      analysisId,
      recommendations: savedRecommendations,
      status: "pending_teacher_review"
    };
  });
}

module.exports = {
  publishPedagogicalAnalysis
};