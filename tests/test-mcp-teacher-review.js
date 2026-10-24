
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { Client } = require(
  "@modelcontextprotocol/sdk/client/index.js"
);

const { StdioClientTransport } = require(
  "@modelcontextprotocol/sdk/client/stdio.js"
);

const auditFile = path.join(
  process.cwd(),
  "logs",
  "teacher-reviews.jsonl"
);

async function main() {
  const before = fs.readFileSync(auditFile, "utf8");
  const beforeLines = before.split(/\r?\n/).filter(Boolean);

  const client = new Client({
    name: "edukai-teacher-review-test",
    version: "1.0.0"
  });

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["src/mcp-server.js"],
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATA_SOURCE: "json"
    }
  });

  try {
    await client.connect(transport);

    const response = await client.callTool({
      name: "submit_teacher_review",
      arguments: {
        learnerId: "LRN001",
        recommendation:
          "DEMO TEST: Reinforce mathematics exercises.",
        decision: "approved",
        teacherComment:
          "Synthetic MCP validation test - EDUKAI AFRICA."
      }
    });

    if (response.isError === true) {
      throw new Error(
        JSON.stringify(response.content)
      );
    }

    const review = response.structuredContent?.review;

    if (!review || review.humanReviewed !== true) {
      throw new Error("Invalid teacher review response.");
    }

    const after = fs.readFileSync(auditFile, "utf8");
    const afterLines = after.split(/\r?\n/).filter(Boolean);

    const newRecord = JSON.parse(afterLines.at(-1));

    const passed =
      after.startsWith(before) &&
      afterLines.length === beforeLines.length + 1 &&
      newRecord.reviewId === review.reviewId &&
      newRecord.learnerId === "LRN001" &&
      newRecord.decision === "approved" &&
      newRecord.humanReviewed === true;

    console.log("Review ID :", review.reviewId);
    console.log("Previous records :", beforeLines.length);
    console.log("Current records :", afterLines.length);
    console.log("Audit verification :", passed ? "OK" : "FAILED");

    if (!passed) {
      process.exitCode = 1;
    }
  } finally {
    await client.close();
  }
}

main().catch(error => {
  console.error("TEST ERROR :", error.message);
  process.exitCode = 1;
});
