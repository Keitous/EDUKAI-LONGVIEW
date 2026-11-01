"use strict";

const {
  validateReviewIdentifiers
} = require("./review-identifiers-v03");

const {
  mapTeacherDecision
} = require("./teacher-decision-mapper-v03");

function prepareReviewRequest(data) {
  const identifiers = validateReviewIdentifiers(data);

  const decision = mapTeacherDecision(data.decision);

  const commentaire = data.commentaire ?? null;
  const contenuModifie = data.contenu_modifie ?? null;

  if (
    commentaire !== null &&
    typeof commentaire !== "string"
  ) {
    throw new Error("Commentaire invalide.");
  }

  if (
    contenuModifie !== null &&
    typeof contenuModifie !== "string"
  ) {
    throw new Error("Contenu modifie invalide.");
  }

  if (
    decision === "modifiee" &&
    (
      typeof contenuModifie !== "string" ||
      contenuModifie.trim() === ""
    )
  ) {
    throw new Error(
      "Une recommandation modifiee exige un contenu modifie."
    );
  }

  return {
    ...identifiers,
    decision,
    commentaire:
      commentaire === null ? null : commentaire.trim(),
    contenu_modifie:
      decision === "modifiee"
        ? contenuModifie.trim()
        : null
  };
}

module.exports = {
  prepareReviewRequest
};
