const fs = require("fs");
const path = require("path");
const assert = require("assert");

const {
  analyzeLearnerTrends
} = require("../src/trend-analyzer");

const dataPath = path.join(
  __dirname,
  "..",
  "data",
  "learners.json"
);

const rawData = fs
  .readFileSync(dataPath, "utf8")
  .replace(/^\uFEFF/, "");

const data = JSON.parse(rawData);

function getLearner(learnerId) {
  const learner = data.learners.find(
    (item) => item.id === learnerId
  );

  assert.ok(
    learner,
    `Learner ${learnerId} should exist.`
  );

  return learner;
}

function getTrend(analysis, metric) {
  const trend = analysis.trends.find(
    (item) => item.metric === metric
  );

  assert.ok(
    trend,
    `Metric ${metric} should exist.`
  );

  return trend;
}

const results = [];

function runScenario(name, testFunction) {
  try {
    testFunction();

    results.push({
      name,
      status: "PASS"
    });

    console.log(`PASS - ${name}`);
  } catch (error) {
    results.push({
      name,
      status: "FAIL",
      error: error.message
    });

    console.error(`FAIL - ${name}`);
    console.error(`       ${error.message}`);
  }
}

console.log(
  "\n=== EDUKAI LONGVIEW EVALUATION SUITE ===\n"
);

/*
 * LRN001
 * Strong longitudinal improvement.
 */
runScenario(
  "LRN001 - Emerging strengths with high confidence",
  () => {
    const analysis = analyzeLearnerTrends(
      getLearner("LRN001")
    );

    const mathematics = getTrend(
      analysis,
      "mathematics"
    );

    const science = getTrend(
      analysis,
      "science"
    );

    assert.strictEqual(
      mathematics.change,
      25
    );

    assert.strictEqual(
      mathematics.direction,
      "improving"
    );

    assert.strictEqual(
      mathematics.confidence,
      "high"
    );

    assert.strictEqual(
      science.change,
      12
    );

    assert.strictEqual(
      science.confidence,
      "high"
    );

    assert.ok(
      analysis.emergingStrengths.some(
        (item) =>
          item.metric === "mathematics"
      )
    );

    assert.ok(
      analysis.emergingStrengths.some(
        (item) =>
          item.metric === "science"
      )
    );

    assert.strictEqual(
      analysis.dataQuality.complete,
      true
    );
  }
);

/*
 * LRN002
 * Persistent difficulties.
 */
runScenario(
  "LRN002 - Persistent difficulties",
  () => {
    const analysis = analyzeLearnerTrends(
      getLearner("LRN002")
    );

    const mathematics = getTrend(
      analysis,
      "mathematics"
    );

    const language = getTrend(
      analysis,
      "language"
    );

    assert.strictEqual(
      mathematics.last,
      45
    );

    assert.strictEqual(
      mathematics.confidence,
      "high"
    );

    assert.strictEqual(
      language.last,
      48
    );

    assert.strictEqual(
      language.confidence,
      "high"
    );

    assert.ok(
      analysis.persistentDifficulties.some(
        (item) =>
          item.metric === "mathematics"
      )
    );

    assert.ok(
      analysis.persistentDifficulties.some(
        (item) =>
          item.metric === "language"
      )
    );

    assert.ok(
      !analysis.persistentDifficulties.some(
        (item) =>
          item.metric === "science"
      )
    );
  }
);

/*
 * LRN003
 * Sustained decline.
 */
runScenario(
  "LRN003 - Declining longitudinal trends",
  () => {
    const analysis = analyzeLearnerTrends(
      getLearner("LRN003")
    );

    const mathematics = getTrend(
      analysis,
      "mathematics"
    );

    const science = getTrend(
      analysis,
      "science"
    );

    const language = getTrend(
      analysis,
      "language"
    );

    const attendance = getTrend(
      analysis,
      "attendance"
    );

    assert.strictEqual(
      mathematics.change,
      -13
    );

    assert.strictEqual(
      science.change,
      -13
    );

    assert.strictEqual(
      language.change,
      -7
    );

    assert.strictEqual(
      attendance.change,
      -7
    );

    for (const trend of [
      mathematics,
      science,
      language,
      attendance
    ]) {
      assert.strictEqual(
        trend.direction,
        "declining"
      );

      assert.strictEqual(
        trend.confidence,
        "high"
      );
    }

    assert.strictEqual(
      analysis.dataQuality.complete,
      true
    );
  }
);

/*
 * LRN004
 * Stable learner.
 */
runScenario(
  "LRN004 - Stable profile without false alerts",
  () => {
    const analysis = analyzeLearnerTrends(
      getLearner("LRN004")
    );

    for (const trend of analysis.trends) {
      assert.strictEqual(
        trend.direction,
        "stable"
      );

      assert.strictEqual(
        trend.confidence,
        "high"
      );
    }

    assert.strictEqual(
      analysis.emergingStrengths.length,
      0
    );

    assert.strictEqual(
      analysis.persistentDifficulties.length,
      0
    );

    assert.strictEqual(
      analysis.dataQuality.complete,
      true
    );
  }
);

/*
 * LRN005
 * Missing longitudinal observations.
 */
runScenario(
  "LRN005 - Missing data with limited confidence",
  () => {
    const analysis = analyzeLearnerTrends(
      getLearner("LRN005")
    );

    const mathematics = getTrend(
      analysis,
      "mathematics"
    );

    assert.deepStrictEqual(
      mathematics.values,
      [61, null, 73]
    );

    assert.strictEqual(
      mathematics.change,
      12
    );

    assert.strictEqual(
      mathematics.direction,
      "improving"
    );

    assert.strictEqual(
      mathematics.dataComplete,
      false
    );

    assert.strictEqual(
      mathematics.observationsUsed,
      2
    );

    assert.strictEqual(
      mathematics.confidence,
      "limited"
    );

    assert.deepStrictEqual(
      mathematics.missingYears,
      ["2024-2025"]
    );

    assert.strictEqual(
      analysis.dataQuality.complete,
      false
    );

    assert.strictEqual(
      analysis.dataQuality.incompleteMetrics.length,
      4
    );

    const mathStrength =
      analysis.emergingStrengths.find(
        (item) =>
          item.metric === "mathematics"
      );

    assert.ok(mathStrength);

    assert.strictEqual(
      mathStrength.confidence,
      "limited"
    );
  }
);

/*
 * Final evaluation report.
 */
const passed = results.filter(
  (result) => result.status === "PASS"
).length;

const failed = results.filter(
  (result) => result.status === "FAIL"
).length;

const total = results.length;

console.log(
  "\n=== EVALUATION SUMMARY ==="
);

console.log(`Total scenarios : ${total}`);
console.log(`Passed          : ${passed}`);
console.log(`Failed          : ${failed}`);

console.log(
  `Success rate    : ${(
    (passed / total) *
    100
  ).toFixed(1)}%`
);

if (failed > 0) {
  console.error(
    "\nEDUKAI LongView evaluation FAILED."
  );

  process.exit(1);
}

console.log(
  "\nEDUKAI LongView evaluation PASSED."
);