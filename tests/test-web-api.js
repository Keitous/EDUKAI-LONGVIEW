const assert = require("assert");

const {
  app,
  loadLearners,
  analysisRegistry
} = require("../src/web-server");

async function main() {
  console.log(
    "\n=== WEB API TESTS ===\n"
  );

  /*
   * Test 1:
   * Dataset accessible through
   * the Web API backend.
   */
  const learners =
    loadLearners();

  assert.strictEqual(
    learners.length,
    5
  );

  assert.strictEqual(
    learners[0].id,
    "LRN001"
  );

  console.log(
    "PASS - Synthetic learner dataset loaded"
  );

  /*
   * Start Express on an ephemeral port.
   * Port 0 lets the operating system
   * choose an available test port.
   */
  const server =
    app.listen(0);

  await new Promise(
    (resolve) =>
      server.once(
        "listening",
        resolve
      )
  );

  const address =
    server.address();

  const baseUrl =
    `http://127.0.0.1:${address.port}`;

  try {
    /*
     * Test 2:
     * Health endpoint.
     */
    const healthResponse =
      await fetch(
        `${baseUrl}/api/health`
      );

    assert.strictEqual(
      healthResponse.status,
      200
    );

    const health =
      await healthResponse.json();

    assert.strictEqual(
      health.status,
      "ok"
    );

    assert.strictEqual(
      health.humanReviewRequired,
      true
    );

    assert.strictEqual(
      health.syntheticData,
      true
    );

    console.log(
      "PASS - Health endpoint exposes safety metadata"
    );

    /*
     * Test 3:
     * Learner endpoint.
     */
    const learnersResponse =
      await fetch(
        `${baseUrl}/api/learners`
      );

    assert.strictEqual(
      learnersResponse.status,
      200
    );

    const learnersPayload =
      await learnersResponse.json();

    assert.strictEqual(
      learnersPayload.success,
      true
    );

    assert.strictEqual(
      learnersPayload.count,
      5
    );

    assert.strictEqual(
      learnersPayload.learners[0].id,
      "LRN001"
    );

    assert.strictEqual(
      learnersPayload.learners[0].syntheticData,
      true
    );

    console.log(
      "PASS - Learner endpoint returns synthetic learner summaries"
    );
    /*
     * Test 4:
     * A teacher review must reference
     * a registered analysis.
     */
    const missingAnalysisIdResponse =
      await fetch(
        `${baseUrl}/api/review`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            learnerId: "LRN001",
            recommendation:
              "Test recommendation",
            decision:
              "approved",
            teacherComment:
              ""
          })
        }
      );

    assert.strictEqual(
      missingAnalysisIdResponse.status,
      400
    );

    const missingAnalysisId =
      await missingAnalysisIdResponse.json();

    assert.strictEqual(
      missingAnalysisId.success,
      false
    );

    assert.strictEqual(
      missingAnalysisId.error,
      "Analysis ID is required."
    );

        console.log(
      "PASS - Teacher review requires an analysis ID"
    );

    /*
     * Test 5:
     * An unknown analysis ID
     * must be rejected.
     */
    const unknownAnalysisResponse =
      await fetch(
        `${baseUrl}/api/review`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            learnerId: "LRN001",
            analysisId:
              "UNKNOWN-ANALYSIS-ID",
            recommendation:
              "Test recommendation",
            decision:
              "approved",
            teacherComment:
              ""
          })
        }
      );

    assert.strictEqual(
      unknownAnalysisResponse.status,
      404
    );

    const unknownAnalysis =
      await unknownAnalysisResponse.json();

    assert.strictEqual(
      unknownAnalysis.success,
      false
    );

    assert.strictEqual(
      unknownAnalysis.error,
      "Analysis not found."
    );

    console.log(
      "PASS - Unknown analysis ID rejected"
    );
    /*
     * Test 6:
     * An analysis registered for LRN001
     * must not be reviewed as LRN002.
     */
    const registeredAnalysisId =
      "TEST-LRN001-ANALYSIS";

    const registeredRecommendation =
      "Synthetic registered analysis for LRN001";

    analysisRegistry.set(
      registeredAnalysisId,
      {
        learnerId: "LRN001",
        analysis:
          registeredRecommendation,
        createdAt:
          new Date().toISOString()
      }
    );

    const wrongLearnerResponse =
      await fetch(
        `${baseUrl}/api/review`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            learnerId: "LRN002",
            analysisId:
              registeredAnalysisId,
            recommendation:
              registeredRecommendation,
            decision:
              "approved",
            teacherComment:
              ""
          })
        }
      );

    assert.strictEqual(
      wrongLearnerResponse.status,
      409
    );

    const wrongLearner =
      await wrongLearnerResponse.json();

    assert.strictEqual(
      wrongLearner.success,
      false
    );

    assert.strictEqual(
      wrongLearner.error,
      "Analysis does not belong to this learner."
    );

    console.log(
      "PASS - Cross-learner analysis review rejected"
    );
	    /*
     * Test 7:
     * The recommendation must match
     * the registered analysis exactly.
     */
    const tamperedAnalysisResponse =
      await fetch(
        `${baseUrl}/api/review`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            learnerId: "LRN001",
            analysisId:
              registeredAnalysisId,
            recommendation:
              "Modified recommendation",
            decision:
              "approved",
            teacherComment:
              ""
          })
        }
      );

    assert.strictEqual(
      tamperedAnalysisResponse.status,
      409
    );

    const tamperedAnalysis =
      await tamperedAnalysisResponse.json();

    assert.strictEqual(
      tamperedAnalysis.success,
      false
    );

    assert.strictEqual(
      tamperedAnalysis.error,
      "Recommendation does not match the registered analysis."
    );

    console.log(
      "PASS - Tampered analysis review rejected"
    );
    /*
     * Test 8:
     * Invalid Human-in-the-Loop
     * decision must be rejected.
     *
     * This test does not write
     * a teacher review log.
     */
    const invalidReviewResponse =
      await fetch(
        `${baseUrl}/api/review`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
         body: JSON.stringify({
  learnerId: "LRN001",
  analysisId:
    "TEST-INVALID-ANALYSIS",
  recommendation:
    "Test recommendation",
  decision:
    "auto_approved",
  teacherComment:
    ""
})
        }
      );

    assert.strictEqual(
      invalidReviewResponse.status,
      400
    );

    const invalidReview =
      await invalidReviewResponse.json();

    assert.strictEqual(
      invalidReview.success,
      false
    );
    assert.strictEqual(
      invalidReview.error,
      "Invalid teacher decision."
    );
    console.log(
      "PASS - Invalid teacher decision rejected"
    );

    console.log(
      "\nEDUKAI LongView Web API tests PASSED."
    );
  } finally {
    await new Promise(
      (resolve, reject) => {
        server.close(
          (error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          }
        );
      }
    );
  }
}

main().catch(
  (error) => {
    console.error(
      "\nWEB API TEST FAILED:"
    );

    console.error(error);

    if (error.cause) {
      console.error(
        "\nUNDERLYING CAUSE:"
      );

      console.error(
        error.cause
      );
    }

    process.exit(1);
  }
);