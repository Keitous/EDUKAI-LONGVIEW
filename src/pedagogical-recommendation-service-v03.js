"use strict";

const {
  analyzeLearner
} = require("./longitudinal-service-v03");

function buildRecommendations(analysis) {
  if (!analysis || !Array.isArray(analysis.subjects)) {
    return [];
  }

  const recommendations = [];

  const academic = analysis.subjects.filter(
    subject =>
      subject.subject !== "attendance" &&
      Number.isFinite(subject.change)
  );

  for (const subject of academic) {
    if (subject.change < 0) {
      recommendations.push({
        subject: subject.subject,
        priority: "high",
        observation: `Baisse de ${Math.abs(subject.change)} points.`,
        action: `Examiner les difficultes en ${subject.label} et proposer un accompagnement cible.`,
        requiresTeacherValidation: true
      });
    }
  }

  if (
    analysis.slowestImprovement &&
    analysis.slowestImprovement.change >= 0 &&
    academic.length >= 2
  ) {
    const subject = analysis.slowestImprovement;

    recommendations.push({
      subject: subject.subject,
      priority: "monitoring",
      observation: `Progression de ${subject.change} points, la plus faible parmi les matieres analysees.`,
      action: `Examiner avec l'enseignant les besoins eventuels de renforcement en ${subject.label}.`,
      requiresTeacherValidation: true
    });
  }

  if (
    analysis.strongestImprovement &&
    analysis.strongestImprovement.change > 0
  ) {
    const subject = analysis.strongestImprovement;

    recommendations.push({
      subject: subject.subject,
      priority: "positive",
      observation: `Progression de ${subject.change} points.`,
      action: `Valoriser les progres en ${subject.label} et identifier les pratiques pedagogiques efficaces.`,
      requiresTeacherValidation: true
    });
  }

  const attendance = analysis.subjects.find(
    subject => subject.subject === "attendance"
  );

  if (attendance && Number.isFinite(attendance.change) &&
      attendance.change < 0) {
    recommendations.push({
      subject: "attendance",
      priority: "monitoring",
      observation: `Baisse de l'assiduite de ${Math.abs(attendance.change)} points.`,
      action: "Echanger avec l'apprenant pour comprendre les causes possibles de cette evolution.",
      requiresTeacherValidation: true
    });
  }

  return recommendations;
}

async function recommendForLearner(id) {
  const analysis = await analyzeLearner(id);

  if (!analysis) return null;

  return {
    learnerId: analysis.learnerId,
    learnerName: analysis.learnerName,
    period: analysis.period || null,
    recommendations: buildRecommendations(analysis),
    status: "pending_teacher_review",
    teacherReviewRequired: true,
    syntheticData: true,
    engine: "explainable_rules_v03"
  };
}

module.exports = {
  buildRecommendations,
  recommendForLearner
};
