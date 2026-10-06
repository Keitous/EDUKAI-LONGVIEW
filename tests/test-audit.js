const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  createAuditSession,
  addAuditEvent,
  saveAuditSession
} = require("../src/audit-logger");

function main() {
  console.log(
    "\n=== AGENT AUDIT TEST ===\n"
  );

  const session = createAuditSession({
    question:
      "Test longitudinal analysis",
    provider: "test-provider",
    model: "test-model"
  });

  assert.ok(
    session.auditId,
    "Audit ID should exist."
  );

  assert.strictEqual(
    session.question,
    "Test longitudinal analysis"
  );

  assert.strictEqual(
    session.events.length,
    0
  );

  addAuditEvent(
    session,
    "agent_started",
    {
      humanReviewRequired: true
    }
  );

  addAuditEvent(
    session,
    "mcp_tool_called",
    {
      step: 1,
      tool: "analyze_longitudinal_trends",
      arguments: {
        learnerId: "TEST001"
      }
    }
  );

  addAuditEvent(
    session,
    "mcp_tool_result",
    {
      step: 1,
      tool: "analyze_longitudinal_trends",
      success: true
    }
  );

  addAuditEvent(
    session,
    "agent_completed",
    {
      finalResponse:
        "Synthetic test recommendation.",
      humanReviewRequired: true
    }
  );

  const saved = saveAuditSession(
    session,
    "completed"
  );

  assert.strictEqual(
    saved.status,
    "completed"
  );

  assert.strictEqual(
    saved.humanReviewRequired,
    true
  );

  assert.strictEqual(
    saved.consequentialActionExecuted,
    false
  );

  assert.strictEqual(
    saved.events.length,
    4
  );

  assert.deepStrictEqual(
    saved.events.map(
      (event) => event.type
    ),
    [
      "agent_started",
      "mcp_tool_called",
      "mcp_tool_result",
      "agent_completed"
    ]
  );

  /*
   * Security regression check:
   * the audit record must not contain
   * API-key fields.
   */
  const serialized =
    JSON.stringify(saved);

  assert.strictEqual(
    serialized.includes("apiKey"),
    false
  );

  assert.strictEqual(
    serialized.includes("GROQ_API_KEY"),
    false
  );

  const auditFile = path.join(
    __dirname,
    "..",
    "logs",
    "agent-audit.jsonl"
  );

  assert.strictEqual(
    fs.existsSync(auditFile),
    true,
    "Audit file should exist."
  );

  console.log(
    "PASS - Audit session created"
  );

  console.log(
    "PASS - MCP actions recorded"
  );

  console.log(
    "PASS - Human review boundary recorded"
  );

  console.log(
    "PASS - No API-key field stored"
  );

  console.log(
    "\nEDUKAI LongView audit test PASSED."
  );
}

try {
  main();
} catch (error) {
  console.error(
    "\nAUDIT TEST FAILED:"
  );

  console.error(
    error.message || error
  );

  process.exit(1);
}