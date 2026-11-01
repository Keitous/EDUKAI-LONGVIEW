"use strict";

async function getAllLearners() {
  const repository = require(
    "../db/learner-repository-v03"
  );

  return repository.getAllLearners();
}

async function getLearnerById(id) {
  const repository = require(
    "../db/learner-repository-v03"
  );

  return repository.getLearnerById(id);
}

module.exports = {
  getAllLearners,
  getLearnerById
};
