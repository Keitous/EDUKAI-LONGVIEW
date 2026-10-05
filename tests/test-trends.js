const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

async function main() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["src/mcp-server.js"]
  });

  const client = new Client({
    name: "edukai-longview-trend-test",
    version: "1.0.0"
  });

  await client.connect(transport);

  console.log("\n=== LONGITUDINAL TREND TEST ===");

  const result = await client.callTool({
    name: "analyze_longitudinal_trends",
    arguments: {
      learnerId: "LRN001"
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
  console.error("TREND TEST FAILED:");
  console.error(error);
  process.exit(1);
});
