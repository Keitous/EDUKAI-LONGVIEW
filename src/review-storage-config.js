"use strict";

const {
  verifyV03Configuration
} = require("./db/pedagogical-review-repository");

const MODES = Object.freeze({
  HISTORIQUE: "historique",
  POSTGRES_V03: "postgres_v03"
});

function getReviewStorageMode() {
  const mode = (
    process.env.EDUKAI_REVIEW_STORAGE ||
    MODES.HISTORIQUE
  ).trim();

  if (!Object.values(MODES).includes(mode)) {
    throw new Error(
      "Mode de stockage EDUKAI invalide : " + mode
    );
  }

  if (mode === MODES.POSTGRES_V03) {
    verifyV03Configuration();
  }

  return mode;
}

module.exports = {
  MODES,
  getReviewStorageMode
};
