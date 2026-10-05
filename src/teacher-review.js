const fs = require("fs");
const path = require("path");

function submitTeacherReview(review) {
  const allowedDecisions = ["approved", "rejected", "modified"];

  if (!allowedDecisions.includes(review.decision)) {
    throw new Error(
      `Invalid decision. Allowed decisions: ${allowedDecisions.join(", ")}`
    );
  }

  const auditDir = path.join(__dirname, "..", "logs");
  const auditFile = path.join(auditDir, "teacher-reviews.jsonl");

  fs.mkdirSync(auditDir, { recursive: true });

  const record = {
    reviewId: `REV-${Date.now()}`,
    timestamp: new Date().toISOString(),
    learnerId: review.learnerId,
    recommendation: review.recommendation,
    decision: review.decision,
    teacherComment: review.teacherComment || "",
    humanReviewed: true
  };

  fs.appendFileSync(
    auditFile,
    JSON.stringify(record) + "\n",
    "utf8"
  );

  return record;
}

module.exports = {
  submitTeacherReview
};
