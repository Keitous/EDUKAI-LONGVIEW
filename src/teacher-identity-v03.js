"use strict";

const {
  validateReviewIdentifiers
} = require("./review-identifiers-v03");

function requireAuthenticatedTeacher(identity) {
  if (
    identity === null ||
    typeof identity !== "object" ||
    Array.isArray(identity) ||
    identity.authenticated !== true ||
    identity.role !== "enseignant"
  ) {
    throw new Error(
      "Authentification enseignant requise."
    );
  }

  const identifiers = validateReviewIdentifiers({
    id_recommandation: 1,
    id_enseignant: identity.id_enseignant
  });

  return {
    id_enseignant: identifiers.id_enseignant,
    role: "enseignant"
  };
}

module.exports = {
  requireAuthenticatedTeacher
};
