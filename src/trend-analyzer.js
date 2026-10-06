function analyzeLearnerTrends(learner) {
  if (
    !learner ||
    !Array.isArray(learner.records) ||
    learner.records.length < 2
  ) {
    throw new Error(
      "At least two learner records are required for longitudinal analysis."
    );
  }

  const metrics = [
    "mathematics",
    "science",
    "language",
    "attendance"
  ];

  const trends = metrics.map((metric) => {
    const observations = learner.records.map((record) => {
      const rawValue = record[metric];

      return {
        year: record.year,
        value:
          rawValue === null ||
          rawValue === undefined ||
          rawValue === ""
            ? null
            : Number(rawValue)
      };
    });

    const validObservations = observations.filter(
      (observation) =>
        observation.value !== null &&
        Number.isFinite(observation.value)
    );

    const missingYears = observations
      .filter((observation) => observation.value === null)
      .map((observation) => observation.year);

    /*
     * Confidence rules:
     * - high: all expected observations are available
     * - limited: at least 2 observations are available,
     *            but some data is missing
     * - insufficient: fewer than 2 valid observations
     */
    let confidence = "insufficient";

    if (validObservations.length >= 2) {
      confidence =
        validObservations.length === observations.length
          ? "high"
          : "limited";
    }

    /*
     * A longitudinal trend requires at least
     * two valid observations.
     */
    if (validObservations.length < 2) {
      return {
        metric,
        values: observations.map(
          (observation) => observation.value
        ),
        first: validObservations[0]?.value ?? null,
        last:
          validObservations.length > 0
            ? validObservations[
                validObservations.length - 1
              ].value
            : null,
        change: null,
        direction: "insufficient_data",
        dataComplete: missingYears.length === 0,
        missingYears,
        observationsUsed: validObservations.length,
        confidence
      };
    }

    const first = validObservations[0].value;
    const last =
      validObservations[
        validObservations.length - 1
      ].value;

    const change = last - first;

    let direction = "stable";

    if (change >= 5) {
      direction = "improving";
    }

    if (change <= -5) {
      direction = "declining";
    }

    return {
      metric,
      values: observations.map(
        (observation) => observation.value
      ),
      first,
      last,
      change,
      direction,
      dataComplete: missingYears.length === 0,
      missingYears,
      observationsUsed: validObservations.length,
      confidence
    };
  });

  /*
   * Academic metrics only.
   * Attendance is analyzed separately and cannot
   * become an academic emerging strength.
   */
  const academicTrends = trends.filter(
    (trend) => trend.metric !== "attendance"
  );

  /*
   * Keep only metrics for which a real numerical
   * longitudinal comparison was possible.
   */
  const comparableAcademicTrends =
    academicTrends.filter(
      (trend) => Number.isFinite(trend.change)
    );

  const strongestImprovement =
    comparableAcademicTrends.length > 0
      ? [...comparableAcademicTrends].sort(
          (a, b) => b.change - a.change
        )[0]
      : null;

  /*
   * Emerging strength:
   * improvement of at least 10 points.
   *
   * A strength may still be detected with incomplete
   * data, but its confidence will explicitly be
   * marked as "limited".
   */
  const emergingStrengths =
    comparableAcademicTrends
      .filter((trend) => trend.change >= 10)
      .map((trend) => ({
        metric: trend.metric,
        evidence: `${trend.first} -> ${trend.last}`,
        change: trend.change,
        dataComplete: trend.dataComplete,
        confidence: trend.confidence
      }));

  /*
   * Persistent difficulty:
   * latest available academic score below 50.
   */
  const persistentDifficulties =
    academicTrends
      .filter(
        (trend) =>
          Number.isFinite(trend.last) &&
          trend.last < 50
      )
      .map((trend) => ({
        metric: trend.metric,
        latestScore: trend.last,
        dataComplete: trend.dataComplete,
        confidence: trend.confidence
      }));

  /*
   * Explicit data-quality report.
   */
  const incompleteMetrics = trends
    .filter((trend) => !trend.dataComplete)
    .map((trend) => ({
      metric: trend.metric,
      missingYears: trend.missingYears,
      observationsUsed: trend.observationsUsed,
      confidence: trend.confidence
    }));

  return {
    learnerId: learner.id,
    learnerName: learner.name,
    yearsAnalyzed: learner.records.map(
      (record) => record.year
    ),
    trends,
    strongestImprovement,
    emergingStrengths,
    persistentDifficulties,
    dataQuality: {
      complete: incompleteMetrics.length === 0,
      incompleteMetrics
    }
  };
}

module.exports = {
  analyzeLearnerTrends
};