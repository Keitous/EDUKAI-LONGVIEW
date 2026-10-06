const assert = require("assert");

const {
  checkResponseSafety
} = require("../src/response-safety");

function main() {
  console.log(
    "\n=== RESPONSE SAFETY TESTS ===\n"
  );

  /*
   * Scenario 1:
   * Real unsupported causal wording previously
   * produced by the LLM.
   */
  const causalResponse =
    "La progression en mathématiques suggère que " +
    "les stratégies ou le soutien actuellement en place " +
    "dans cette discipline portent leurs fruits.";

  const causalCheck =
    checkResponseSafety(causalResponse);

  assert.strictEqual(
    causalCheck.safe,
    false
  );

  assert.ok(
    causalCheck.violations.some(
      (item) =>
        item.type ===
        "unsupported_causal_claim"
    )
  );

  console.log(
    "PASS - Unsupported causal claim detected"
  );

  /*
   * Scenario 2:
   * Real unsupported schedule wording previously
   * produced by the LLM.
   */
  const scheduleResponse =
    "Un suivi régulier, par exemple à chaque trimestre, " +
    "pourrait aider à confirmer que la progression se maintient.";

  const scheduleCheck =
    checkResponseSafety(scheduleResponse);

  assert.strictEqual(
    scheduleCheck.safe,
    false
  );

  assert.ok(
    scheduleCheck.violations.some(
      (item) =>
        item.type ===
        "unsupported_followup_schedule"
    )
  );

  console.log(
    "PASS - Unsupported follow-up schedule detected"
  );

  /*
   * Scenario 3:
   * Safe evidence-based wording.
   */
  const safeResponse =
    "Les mathématiques passent de 58 à 83, soit +25 points. " +
    "Le professeur peut envisager de consolider les acquis. " +
    "La fréquence du suivi doit être déterminée par l'enseignant.";

  const safeCheck =
    checkResponseSafety(safeResponse);

  assert.strictEqual(
    safeCheck.safe,
    true
  );

  assert.deepStrictEqual(
    safeCheck.violations,
    []
  );

  console.log(
    "PASS - Evidence-based cautious response accepted"
  );

  console.log(
    "\n=== RESPONSE SAFETY SUMMARY ==="
  );

  console.log("Total scenarios : 3");
  console.log("Passed          : 3");
  console.log("Failed          : 0");

  console.log(
    "\nEDUKAI LongView response safety tests PASSED."
  );
}

try {
  main();
} catch (error) {
  console.error(
    "\nRESPONSE SAFETY TEST FAILED:"
  );

  console.error(
    error.message || error
  );

  process.exit(1);
}