"use strict";

const assert = require("node:assert/strict");

const {
  canTeacherAccessAssignedLearner
} = require("../src/pedagogical-assignment-access-v03");

const {
  pool
} = require("../src/db/postgres-pedagogical-v03");

async function main() {
  const tests = [
    { teacher: 1, learner: "LRN001", expected: true },
    { teacher: 1, learner: "LRN002", expected: true },
    { teacher: 1, learner: "LRN003", expected: true },
    { teacher: 1, learner: "LRN004", expected: true },
    { teacher: 1, learner: "LRN005", expected: true },
    { teacher: 1, learner: "LRN999", expected: false },
    { teacher: 999999, learner: "LRN001", expected: false },
    { teacher: 0, learner: "LRN001", expected: false },
    { teacher: null, learner: "LRN001", expected: false },
    { teacher: 1, learner: "INVALID", expected: false },
    { teacher: 1, learner: null, expected: false }
  ];

  let passed = 0;

  for (const test of tests) {
    const actual = await canTeacherAccessAssignedLearner(
      test.teacher,
      test.learner
    );

    assert.equal(
      actual,
      test.expected,
      `Autorisation incorrecte : ${test.teacher}/${test.learner}`
    );

    passed++;

    console.log(
      `OK ${passed}/${tests.length} : ` +
      `${test.teacher}/${test.learner}`
    );
  }

  console.log(
    `SUCCES : ${passed}/${tests.length} tests d'autorisation.`
  );
}

main()
  .catch(error => {
    console.error("ECHEC :", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });