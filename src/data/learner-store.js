
"use strict";

const fs = require("fs");
const path = require("path");

const LEARNERS_FILE = path.join(
  __dirname,
  "..",
  "..",
  "data",
  "learners.json"
);

function getDataSource() {
  const source = (
    process.env.DATA_SOURCE || "json"
  ).trim().toLowerCase();

  if (!["json", "postgres"].includes(source)) {
    throw new Error(
      `Unsupported DATA_SOURCE: ${source}`
    );
  }

  return source;
}

function loadLearnersFromJson() {
  const rawData = fs.readFileSync(
    LEARNERS_FILE,
    "utf8"
  );

  const cleanData = rawData.replace(
    /^\uFEFF/,
    ""
  );

  const data = JSON.parse(cleanData);

  return data.learners || [];
}

async function getAllLearners() {
  const source = getDataSource();

  if (source === "postgres") {
    const repository = require(
      "../db/learner-repository"
    );

    return repository.getAllLearners();
  }

  return loadLearnersFromJson();
}

async function getLearnerById(id) {
  const learners = await getAllLearners();

  return learners.find(
    learner => learner.id === id
  ) || null;
}

module.exports = {
  getDataSource,
  getAllLearners,
  getLearnerById
};
