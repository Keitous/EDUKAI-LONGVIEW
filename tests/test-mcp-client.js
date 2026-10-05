const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

async function main() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["src/mcp-server.js"]
  });

  const client = new Client({
    name: "edukai-longview-test-client",
    version: "1.0.0"
  });

  await client.connect(transport);

  console.log("\n=== MCP CONNECTION SUCCESSFUL ===");

  const tools = await client.listTools();

  console.log("\n=== AVAILABLE MCP TOOLS ===");
  for (const tool of tools.tools) {
    console.log(`- ${tool.name}: ${tool.description}`);
  }

  console.log("\n=== CALLING get_learner_profile ===");

  const result = await client.callTool({
    name: "get_learner_profile",
    arguments: {
      learnerId: "LRN001"
    }
  });

  console.log("\n=== MCP RESULT ===");

  for (const item of result.content || []) {
    if (item.type === "text") {
      console.log(item.text);
    }
  }

  await client.close();
}

main().catch((error) => {
  console.error("MCP TEST FAILED:");
  console.error(error);
  process.exit(1);
});
