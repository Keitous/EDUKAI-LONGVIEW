function retrieveEvidence(learner, metric) {
  if (!learner || !Array.isArray(learner.records)) {
    throw new Error(
      "Valid learner records are required."
    );
  }

  const allowedMetrics = [
    "mathematics",
    "science",
    "language",
    "attendance"
  ];

  const normalizedMetric =
    String(metric).toLowerCase();

  if (
    !allowedMetrics.includes(normalizedMetric)
  ) {
    throw new Error(
      `Unsupported metric: ${metric}. Allowed metrics: ${allowedMetrics.join(", ")}`
    );
  }

  /*
   * Preserve missing values explicitly.
   * Never convert null, undefined or an empty value
   * into the numerical value 0.
   */
  const evidence = learner.records.map(
    (record) => {
      const rawValue =
        record[normalizedMetric];

      const value =
        rawValue === null ||
        rawValue === undefined ||
        rawValue === ""
          ? null
          : Number(rawValue);

      return {
        year: record.year,
        metric: normalizedMetric,
        value
      };
    }
  );

  /*
   * Only valid numerical observations may
   * participate in longitudinal calculations.
   */
  const validEvidence = evidence.filter(
    (item) =>
      item.value !== null &&
      Number.isFinite(item.value)
  );

  const missingYears = evidence
    .filter(
      (item) => item.value === null
    )
    .map(
      (item) => item.year
    );

  const observationsUsed =
    validEvidence.length;

  const dataComplete =
    missingYears.length === 0;

  let first = null;
  let last = null;
  let change = null;
  let confidence = "insufficient";

  /*
   * At least two valid observations are required
   * to calculate longitudinal change.
   */
  if (validEvidence.length >= 2) {
    first = validEvidence[0].value;

    last =
      validEvidence[
        validEvidence.length - 1
      ].value;

    change = last - first;

    confidence =
      validEvidence.length ===
      evidence.length
        ? "high"
        : "limited";
  } else if (
    validEvidence.length === 1
  ) {
    first = validEvidence[0].value;
    last = validEvidence[0].value;
  }

  /*
   * Build a summary without inventing values.
   */
  let summary;

  if (change === null) {
    summary =
      `${normalizedMetric}: insufficient data ` +
      `(${observationsUsed} valid observation` +
      `${observationsUsed === 1 ? "" : "s"})`;
  } else {
    summary =
      `${normalizedMetric}: ${first} -> ${last} ` +
      `(${change >= 0 ? "+" : ""}${change})`;
  }

  return {
    learnerId: learner.id,
    learnerName: learner.name,
    metric: normalizedMetric,

    evidence,

    summary,

    first,
    last,
    change,

    dataQuality: {
      complete: dataComplete,
      missingYears,
      observationsUsed,
      confidence
    },

    source:
      "Synthetic longitudinal learner records",

    syntheticData: true
  };
}

module.exports = {
  retrieveEvidence
};