
'use strict';

const { pool } = require('./postgres-pedagogical-v03');

function toNumberOrNull(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error('Valeur numérique PostgreSQL invalide');
  }

  return number;
}

async function getAllLearners() {
  const result = await pool.query(`
    SELECT
      a.id_apprenant AS id,
      a.nom_complet AS name,
      a.pays AS country,
      an.libelle AS year,
      MAX(r.note) FILTER (
        WHERE m.code_matiere = 'MATH'
      ) AS mathematics,
      MAX(r.note) FILTER (
        WHERE m.code_matiere = 'SCI'
      ) AS science,
      MAX(r.note) FILTER (
        WHERE m.code_matiere = 'LANG'
      ) AS language,
      ass.taux_presence AS attendance
    FROM edukai.apprenant a
    JOIN edukai.inscription i
      ON i.id_apprenant = a.id_apprenant
    JOIN edukai.annee_scolaire an
      ON an.id_annee = i.id_annee
    LEFT JOIN edukai.resultat_scolaire r
      ON r.id_inscription = i.id_inscription
    LEFT JOIN edukai.matiere m
      ON m.id_matiere = r.id_matiere
    LEFT JOIN edukai.assiduite ass
      ON ass.id_inscription = i.id_inscription
    WHERE a.donnees_synthetiques = TRUE
      AND i.id_etablissement = (
        SELECT id_etablissement
        FROM edukai.etablissement
        WHERE code_etablissement = 'EDUKAI-DEMO'
      )
    GROUP BY
      a.id_apprenant,
      a.nom_complet,
      a.pays,
      i.id_inscription,
      an.libelle,
      ass.taux_presence
    ORDER BY a.id_apprenant, an.libelle
  `);

  const learners = new Map();

  for (const row of result.rows) {
    if (!learners.has(row.id)) {
      learners.set(row.id, {
        id: row.id,
        name: row.name,
        country: row.country,
        records: []
      });
    }

    learners.get(row.id).records.push({
      year: row.year,
      mathematics: toNumberOrNull(row.mathematics),
      science: toNumberOrNull(row.science),
      language: toNumberOrNull(row.language),
      attendance: toNumberOrNull(row.attendance)
    });
  }

  return Array.from(learners.values());
}

async function getLearnerById(id) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('Identifiant apprenant invalide');
  }

  const learners = await getAllLearners();

  return learners.find(learner => learner.id === id) || null;
}

module.exports = {
  getAllLearners,
  getLearnerById
};
