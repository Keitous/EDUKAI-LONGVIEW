function retrieveEvidence(learner, metric) {
  if (!learner || !Array.isArray(learner.records)) {
    throw new Error("Valid learner records are required.");
  }

  const allowedMetrics = [
    "mathematics",
    "science",
    "language",
    "attendance"
  ];

  const normalizedMetric = String(metric).toLowerCase();

  if (!allowedMetrics.includes(normalizedMetric)) {
    throw new Error(
      `Unsupported metric: ${metric}. Allowed metrics: ${allowedMetrics.join(", ")}`
    );
  }

  const evidence = learner.records.map((record) => ({
    year: record.year,
    metric: normalizedMetric,
    value: record[normalizedMetric]
  }));

  const first = evidence[0].value;
  const last = evidence[evidence.length - 1].value;
  const change = last - first;

  return {
    learnerId: learner.id,
    learnerName: learner.name,
    metric: normalizedMetric,
    evidence,
    summary: `${normalizedMetric}: ${first} -> ${last} (${change >= 0 ? "+" : ""}${change})`,
    source: "Synthetic longitudinal learner records",
    syntheticData: true
  };
}

module.exports = {
  retrieveEvidence
};
