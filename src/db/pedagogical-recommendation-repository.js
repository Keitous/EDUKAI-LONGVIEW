"use strict";

const {
  withV03Transaction
} = require("./pedagogical-review-repository");

const PRIORITES = new Set([
  "faible",
  "normale",
  "elevee"
]);

async function createPedagogicalRecommendation(data) {
  if (
    data === null ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    throw new TypeError(
      "Les donnees de la recommandation sont requises."
    );
  }

  const {
    id_analyse,
    contenu,
    justification = null,
    priorite = "normale"
  } = data;

  if (
    !(
      (typeof id_analyse === "number" &&
       Number.isSafeInteger(id_analyse) &&
       id_analyse > 0) ||
      (typeof id_analyse === "string" &&
       /^[1-9][0-9]*$/.test(id_analyse) &&
       BigInt(id_analyse) <= 9223372036854775807n)
    )
  ) {
    throw new Error("Identifiant d'analyse invalide.");
  }

  if (
    typeof contenu !== "string" ||
    contenu.trim() === ""
  ) {
    throw new Error(
      "Le contenu de la recommandation est obligatoire."
    );
  }

  if (
    justification !== null &&
    typeof justification !== "string"
  ) {
    throw new TypeError(
      "La justification doit etre une chaine ou null."
    );
  }

  if (!PRIORITES.has(priorite)) {
    throw new Error(
      "Priorite invalide : faible, normale ou elevee attendue."
    );
  }

  return withV03Transaction(async (client) => {
    const result = await client.query(
      `
      INSERT INTO edukai.recommandation
        (
          id_analyse,
          contenu,
          justification,
          priorite,
          statut
        )
      VALUES
        ($1, $2, $3, $4, 'en_attente')
      RETURNING
        id_recommandation,
        id_analyse,
        priorite,
        statut,
        date_creation
      `,
      [
        id_analyse,
        contenu.trim(),
        justification === null
          ? null
          : justification.trim(),
        priorite
      ]
    );

    return result.rows[0];
  });
}

module.exports = {
  createPedagogicalRecommendation
};
