"use strict";

const {
  pool
} = require("./db/postgres-pedagogical-v03");

async function canTeacherAccessAssignedLearner(
  teacherId,
  learnerId
) {
  if (
    !Number.isSafeInteger(teacherId) ||
    teacherId <= 0 ||
    typeof learnerId !== "string" ||
    !/^LRN[0-9]{3,10}$/.test(learnerId)
  ) {
    return false;
  }

  try {
    const result = await pool.query(
      `SELECT EXISTS (
         SELECT 1
         FROM edukai.affectation_pedagogique_v03 ap
         JOIN edukai.enseignant e
           ON e.id_enseignant = ap.id_enseignant
         JOIN edukai.inscription i
           ON i.id_inscription = ap.id_inscription
         JOIN edukai.apprenant a
           ON a.id_apprenant = i.id_apprenant
         JOIN edukai.etablissement et
           ON et.id_etablissement = i.id_etablissement
         WHERE e.id_enseignant = $1
           AND i.id_apprenant = $2
           AND e.actif = TRUE
           AND a.actif = TRUE
           AND i.statut = 'active'
           AND ap.actif = TRUE
           AND et.actif = TRUE
           AND e.id_etablissement = i.id_etablissement
           AND CURRENT_DATE >= ap.date_debut
           AND (
             ap.date_fin IS NULL
             OR CURRENT_DATE <= ap.date_fin
           )
       ) AS autorise`,
      [teacherId, learnerId]
    );

    return result.rows[0]?.autorise === true;
  } catch (error) {
    console.error(
      "[EDUKAI V0.3] Verification affectation impossible :",
      error.code || "Erreur PostgreSQL"
    );

    return false;
  }
}

module.exports = {
  canTeacherAccessAssignedLearner
};