const assert = require("assert");

const {
  app,
  loadLearners
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

    console.error(
      error.message || error
    );

    process.exit(1);
  }
);