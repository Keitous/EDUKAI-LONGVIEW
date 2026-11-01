"use strict";

const {
  withV03Transaction
} = require("./pedagogical-review-repository");

const DECISIONS = new Set([
  "approuvee",
  "modifiee",
  "rejetee"
]);

function validateTeacherDecision(decision, contenuModifie = null) {
  if (!DECISIONS.has(decision)) {
    throw new Error(
      "Decision invalide : approuvee, modifiee ou rejetee attendue."
    );
  }

  if (
    decision === "modifiee" &&
    (
      typeof contenuModifie !== "string" ||
      contenuModifie.trim() === ""
    )
  ) {
    throw new Error(
      "Une recommandation modifiee exige un contenu modifie non vide."
    );
  }

  return true;
}

function validatePositiveId(value, nom) {
  const validNumber =
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0;

  const validString =
    typeof value === "string" &&
    /^[1-9][0-9]*$/.test(value) &&
    BigInt(value) <= 9223372036854775807n;

  if (!validNumber && !validString) {
    throw new Error(`${nom} invalide.`);
  }
}

async function preparePedagogicalReview(data) {
  if (
    data === null ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    throw new TypeError("Donnees de validation requises.");
  }

  const {
    id_recommandation,
    id_enseignant,
    decision,
    contenu_modifie = null
  } = data;

  validatePositiveId(id_recommandation, "id_recommandation");
  validatePositiveId(id_enseignant, "id_enseignant");
  validateTeacherDecision(decision, contenu_modifie);

  return withV03Transaction(async (client) => {
    const result = await client.query(
      `SELECT id_recommandation, id_analyse, contenu, statut
       FROM edukai.recommandation
       WHERE id_recommandation = $1
       FOR UPDATE`,
      [id_recommandation]
    );

    if (result.rowCount !== 1) {
      throw new Error("Recommandation introuvable.");
    }

    const recommandation = result.rows[0];

    if (recommandation.statut !== "en_attente") {
      throw new Error(
        "Recommandation deja traitee : nouvelle validation refusee."
      );
    }

    return {
      autorisee: true,
      id_recommandation: recommandation.id_recommandation,
      id_analyse: recommandation.id_analyse,
      id_enseignant,
      decision
    };
  });
}

module.exports = {
  validateTeacherDecision,
  preparePedagogicalReview
};
