const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const LOG_DIRECTORY = path.join(
  __dirname,
  "..",
  "logs"
);

const AUDIT_FILE = path.join(
  LOG_DIRECTORY,
  "agent-audit.jsonl"
);

function sanitize(value) {
  if (value === undefined) {
    return null;
  }

  return value;
}

function createAuditSession({
  question,
  provider,
  model
}) {
  return {
    auditId: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    question: sanitize(question),
    provider: sanitize(provider),
    model: sanitize(model),
    events: []
  };
}

function addAuditEvent(
  session,
  type,
  details = {}
) {
  if (!session || !Array.isArray(session.events)) {
    throw new Error(
      "A valid audit session is required."
    );
  }

  session.events.push({
    timestamp: new Date().toISOString(),
    type,
    ...details
  });
}

function saveAuditSession(
  session,
  status = "completed"
) {
  if (!session) {
    throw new Error(
      "A valid audit session is required."
    );
  }

  fs.mkdirSync(
    LOG_DIRECTORY,
    { recursive: true }
  );

  const record = {
    ...session,
    completedAt: new Date().toISOString(),
    status,
    humanReviewRequired: true,
    consequentialActionExecuted: false
  };

  fs.appendFileSync(
    AUDIT_FILE,
    JSON.stringify(record) + "\n",
    "utf8"
  );

  return record;
}

module.exports = {
  createAuditSession,
  addAuditEvent,
  saveAuditSession
};