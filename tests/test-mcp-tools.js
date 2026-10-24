
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const {
  StdioClientTransport
} = require("@modelcontextprotocol/sdk/client/stdio.js");

async function main() {
  const client = new Client({
    name: "edukai-mcp-test-client",
    version: "1.0.0"
  });

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["src/mcp-server.js"],
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATA_SOURCE: process.env.DATA_SOURCE || "json"
    }
  });

  try {
    await client.connect(transport);

    console.log("Connexion MCP : OK");

    const tools = await client.listTools();
    console.log(
      "Outils disponibles :",
      tools.tools.map(t => t.name).join(", ")
    );

    const tests = [
      {
        name: "get_learner_profile",
        arguments: { learnerId: "LRN001" }
      },
      {
        name: "analyze_longitudinal_trends",
        arguments: { learnerId: "LRN001" }
      },
      {
        name: "retrieve_evidence",
        arguments: {
          learnerId: "LRN001",
          metric: "mathematics"
        }
      }
    ];

    for (const test of tests) {
      const result = await client.callTool({
        name: test.name,
        arguments: test.arguments
      });

      console.log("\nOUTIL :", test.name);
      console.log("ERREUR :", result.isError === true);
      console.log(
        "RESULTAT :",
        JSON.stringify(result.structuredContent ?? result.content, null, 2)
      );
    }
  } finally {
    await client.close();
  }
}

main().catch(error => {
  console.error("Erreur du test MCP :", error);
  process.exitCode = 1;
});
