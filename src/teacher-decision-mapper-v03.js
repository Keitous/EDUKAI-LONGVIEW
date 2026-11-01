"use strict";

const DECISION_MAPPING = Object.freeze({
  approved: "approuvee",
  modified: "modifiee",
  rejected: "rejetee"
});

function mapTeacherDecision(decision) {
  if (
    typeof decision !== "string" ||
    !Object.prototype.hasOwnProperty.call(
      DECISION_MAPPING,
      decision
    )
  ) {
    throw new Error(
      "Decision pedagogique invalide."
    );
  }

  return DECISION_MAPPING[decision];
}

module.exports = {
  mapTeacherDecision
};
