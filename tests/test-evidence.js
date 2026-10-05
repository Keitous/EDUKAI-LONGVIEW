const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

async function main() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["src/mcp-server.js"]
  });

  const client = new Client({
    name: "edukai-longview-evidence-test",
    version: "1.0.0"
  });

  await client.connect(transport);

  console.log("\n=== EVIDENCE RETRIEVAL TEST ===");

  const result = await client.callTool({
    name: "retrieve_evidence",
    arguments: {
      learnerId: "LRN001",
      metric: "mathematics"
    }
  });

  for (const item of result.content || []) {
    if (item.type === "text") {
      console.log(item.text);
    }
  }

  await client.close();
}

main().catch((error) => {
  console.error("EVIDENCE TEST FAILED:");
  console.error(error);
  process.exit(1);
});
