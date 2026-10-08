const path = require("path");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

async function main() {
  const allowedDirectory = path.resolve(
    "data",
    "pedagogical-resources"
  );

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      path.resolve(
        "node_modules",
        "@modelcontextprotocol",
        "server-filesystem",
        "dist",
        "index.js"
      ),
      allowedDirectory
    ]
  });

  const client = new Client({
    name: "edukai-external-mcp-test",
    version: "1.0.0"
  });

  try {
    await client.connect(transport);

    console.log("External MCP server connected.");

    const tools = await client.listTools();

    console.log(
      "Available tools:",
      tools.tools.map(tool => tool.name)
    );

    const result = await client.callTool({
      name: "read_file",
      arguments: {
        path: path.join(
          allowedDirectory,
          "guidance.txt"
        )
      }
    });

    if (result.isError) {
      throw new Error(
        JSON.stringify(result.content)
      );
    }

    console.log("\n=== MCP FILE CONTENT ===");

    for (const item of result.content || []) {
      if (item.type === "text") {
        console.log(item.text);
      }
    }

    console.log("\nExternal MCP test PASSED.");

  } finally {
    await client.close();
  }
}

main().catch(error => {
  console.error("External MCP test FAILED:");
  console.error(error.message);
  process.exitCode = 1;
});
