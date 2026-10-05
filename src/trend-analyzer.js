function analyzeLearnerTrends(learner) {
  if (!learner || !Array.isArray(learner.records) || learner.records.length < 2) {
    throw new Error("At least two learner records are required for longitudinal analysis.");
  }

  const metrics = ["mathematics", "science", "language", "attendance"];

  const trends = metrics.map((metric) => {
    const values = learner.records.map((record) => Number(record[metric]));
    const first = values[0];
    const last = values[values.length - 1];
    const change = last - first;

    let direction = "stable";
    if (change >= 5) direction = "improving";
    if (change <= -5) direction = "declining";

    return {
      metric,
      values,
      first,
      last,
      change,
      direction
    };
  });

  const academicTrends = trends.filter(
    (trend) => trend.metric !== "attendance"
  );

  const strongestImprovement = [...academicTrends].sort(
    (a, b) => b.change - a.change
  )[0];

  const emergingStrengths = academicTrends
    .filter((trend) => trend.change >= 10)
    .map((trend) => ({
      metric: trend.metric,
      evidence: `${trend.first} -> ${trend.last}`,
      change: trend.change
    }));

  const persistentDifficulties = academicTrends
    .filter((trend) => trend.last < 50)
    .map((trend) => ({
      metric: trend.metric,
      latestScore: trend.last
    }));

  return {
    learnerId: learner.id,
    learnerName: learner.name,
    yearsAnalyzed: learner.records.map((record) => record.year),
    trends,
    strongestImprovement,
    emergingStrengths,
    persistentDifficulties
  };
}

module.exports = {
  analyzeLearnerTrends
};
