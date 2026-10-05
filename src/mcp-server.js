const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const fs = require("fs");
const path = require("path");

const server = new McpServer({
  name: "edukai-longview",
  version: "1.0.0"
});

server.registerTool(
  "get_learner_profile",
  {
    title: "Get Learner Profile",
    description:
      "Retrieve a learner's longitudinal educational profile using the learner ID.",
    inputSchema: {
      learnerId: z.string().describe("Unique learner identifier, e.g. LRN001")
    }
  },
  async ({ learnerId }) => {
    const dataPath = path.join(__dirname, "..", "data", "learners.json");

    const rawData = fs.readFileSync(dataPath, "utf8").replace(/^\uFEFF/, "");
    const data = JSON.parse(rawData);

    const learner = data.learners.find(
      (item) => item.id.toLowerCase() === learnerId.toLowerCase()
    );

    if (!learner) {
      return {
        content: [
          {
            type: "text",
            text: `Learner ${learnerId} was not found.`
          }
        ],
        isError: true
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(learner, null, 2)
        }
      ],
      structuredContent: {
        learner
      }
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("EDUKAI AFRICA LongView MCP Server started.");
}

main().catch((error) => {
  console.error("Fatal MCP server error:", error);
  process.exit(1);
});
