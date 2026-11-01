"use strict";

const {
  getLearnerById
} = require("./data/learner-store-v03");

const SUBJECTS = [
  ["mathematics", "Mathematiques"],
  ["science", "Sciences"],
  ["language", "Langues"],
  ["attendance", "Assiduite"]
];

async function analyzeLearner(id) {
  const learner = await getLearnerById(id);

  if (!learner) return null;

  const records = [...learner.records].sort(
    (a, b) => a.year.localeCompare(b.year)
  );

  if (records.length < 2) {
    return {
      learnerId: learner.id,
      learnerName: learner.name,
      status: "insufficient_data",
      message: "Au moins deux annees sont necessaires."
    };
  }

  const first = records[0];
  const last = records[records.length - 1];

  const subjects = SUBJECTS.map(([key, label]) => {
    const start = Number(first[key]);
    const end = Number(last[key]);

    if (!Number.isFinite(start) ||
        !Number.isFinite(end) ||
        first[key] == null ||
        last[key] == null) {
      return {
        subject: key,
        label,
        status: "insufficient_data"
      };
    }

    const change = end - start;

    return {
      subject: key,
      label,
      initial: start,
      final: end,
      change,
      trend: change > 0 ? "improvement" :
             change < 0 ? "decline" : "stable"
    };
  });

  const academic = subjects.filter(
    item => item.subject !== "attendance" &&
            Number.isFinite(item.change)
  );

  const strongest = [...academic].sort(
    (a, b) => b.change - a.change
  )[0] || null;

  const slowest = [...academic].sort(
    (a, b) => a.change - b.change
  )[0] || null;

  return {
    learnerId: learner.id,
    learnerName: learner.name,
    period: {
      from: first.year,
      to: last.year,
      yearsObserved: records.length
    },
    subjects,
    yearlyRecords: records.map(record => ({
      year: record.year,
      mathematics: record.mathematics,
      science: record.science,
      language: record.language,
      attendance: record.attendance
    })),
    strongestImprovement: strongest,
    slowestImprovement: slowest,
    teacherReviewRequired: true,
    syntheticData: true
  };
}

module.exports = {
  analyzeLearner
};
