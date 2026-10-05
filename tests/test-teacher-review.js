const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

async function main() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["src/mcp-server.js"]
  });

  const client = new Client({
    name: "edukai-longview-teacher-review-test",
    version: "1.0.0"
  });

  await client.connect(transport);

  console.log("\n=== HUMAN-IN-THE-LOOP TEST ===");

  const result = await client.callTool({
    name: "submit_teacher_review",
    arguments: {
      learnerId: "LRN001",
      recommendation:
        "Provide Aminata with advanced mathematics activities while continuing to monitor her progress.",
      decision: "approved",
      teacherComment:
        "Approved after reviewing the longitudinal evidence."
    }
  });

  console.log("\n=== TEACHER DECISION ===");

  for (const item of result.content || []) {
    if (item.type === "text") {
      console.log(item.text);
    }
  }

  await client.close();
}

main().catch((error) => {
  console.error("TEACHER REVIEW TEST FAILED:");
  console.error(error);
  process.exit(1);
});
