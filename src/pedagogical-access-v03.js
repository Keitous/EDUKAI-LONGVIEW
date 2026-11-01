"use strict";

// Perimetre provisoire de demonstration.
// A remplacer par les affectations pedagogiques PostgreSQL.

const DEMO_TEACHER_ID = 1;

const DEMO_LEARNERS = new Set([
  "LRN001"
]);

function canTeacherAccessLearner(teacherId, learnerId) {
  return (
    Number.isSafeInteger(teacherId) &&
    teacherId === DEMO_TEACHER_ID &&
    typeof learnerId === "string" &&
    DEMO_LEARNERS.has(learnerId)
  );
}

function requireLearnerPublicationAccess(req, res, next) {
  const teacherId = req.session?.auth?.id_enseignant;
  const learnerId = req.params.id;

  if (!canTeacherAccessLearner(teacherId, learnerId)) {
    return res.status(403).json({
      error: "Acces pedagogique non autorise."
    });
  }

  next();
}

module.exports = {
  canTeacherAccessLearner,
  requireLearnerPublicationAccess
};