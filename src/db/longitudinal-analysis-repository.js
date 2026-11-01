"use strict";

const {
  withV03Transaction
} = require("./pedagogical-review-repository");

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

async function createLongitudinalAnalysis(data) {
  if (!isPlainObject(data)) {
    throw new TypeError("Les donnees de l'analyse sont requises.");
  }

  const {
    id_apprenant,
    periode_debut = null,
    periode_fin = null,
    tendances = {},
    indicateurs = {},
    sources = [],
    modele_ia = null,
    version_agent = "0.3"
  } = data;

  if (
    typeof id_apprenant !== "string" ||
    id_apprenant.trim() === ""
  ) {
    throw new Error("Identifiant apprenant invalide.");
  }

  if (!isPlainObject(tendances)) {
    throw new Error("Les tendances doivent etre un objet JSON.");
  }

  if (!isPlainObject(indicateurs)) {
    throw new Error("Les indicateurs doivent etre un objet JSON.");
  }

  if (!Array.isArray(sources)) {
    throw new Error("Les sources doivent etre un tableau JSON.");
  }

  for (const [nom, valeur] of Object.entries({
    periode_debut,
    periode_fin,
    modele_ia,
    version_agent
  })) {
    if (valeur !== null && typeof valeur !== "string") {
      throw new TypeError(`${nom} doit etre une chaine ou null.`);
    }
  }

  return withV03Transaction(async (client) => {
    const result = await client.query(
      `
      INSERT INTO edukai.analyse_longitudinale (
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
      VALUES (
        $1, $2, $3,
        $4::jsonb,
        $5::jsonb,
        $6::jsonb,
        $7, $8, 'brouillon'
      )
      RETURNING
        id_analyse,
        id_apprenant,
        date_analyse,
        statut
      `,
      [
        id_apprenant.trim(),
        periode_debut,
        periode_fin,
        JSON.stringify(tendances),
        JSON.stringify(indicateurs),
        JSON.stringify(sources),
        modele_ia,
        version_agent
      ]
    );

    return result.rows[0];
  });
}

module.exports = {
  createLongitudinalAnalysis
};
