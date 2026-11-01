"use strict";

const MAX_BIGINT = 9223372036854775807n;

function validatePositiveId(value, fieldName) {
  const validNumber =
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0;

  const validString =
    typeof value === "string" &&
    /^[1-9][0-9]*$/.test(value) &&
    BigInt(value) <= MAX_BIGINT;

  if (!validNumber && !validString) {
    throw new Error(
      `${fieldName} invalide.`
    );
  }

  return String(value);
}

function validateReviewIdentifiers(data) {
  if (
    data === null ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    throw new TypeError(
      "Donnees de validation requises."
    );
  }

  return {
    id_recommandation: validatePositiveId(
      data.id_recommandation,
      "id_recommandation"
    ),
    id_enseignant: validatePositiveId(
      data.id_enseignant,
      "id_enseignant"
    )
  };
}

module.exports = {
  validateReviewIdentifiers
};
