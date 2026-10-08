const path = require("path");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

const resourceDirectory = path.resolve(
  __dirname, "..", "data", "pedagogical-resources"
);

const guidanceFile = path.join(resourceDirectory, "guidance.txt");

async function connectExternalMCP() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      require.resolve("@modelcontextprotocol/server-filesystem/dist/index.js"),
      resourceDirectory
    ]
  });

  const client = new Client({
    name: "edukai-external-mcp-client",
    version: "1.0.0"
  });

  await client.connect(transport);

  const availableTools = await client.listTools();

  if (!availableTools.tools.some(t => t.name === "read_text_file")) {
    await client.close();
    throw new Error("Required external MCP tool not available.");
  }

  async function readGuidance() {
    const result = await client.callTool({
      name: "read_text_file",
      arguments: {
        path: guidanceFile
      }
    });

    if (result.isError) {
      throw new Error("External MCP guidance retrieval failed.");
    }

    return result;
  }

  return {
    client,
    readGuidance
  };
}

module.exports = {
  connectExternalMCP
};
