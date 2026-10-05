const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const fs = require("fs");
const path = require("path");
const { analyzeLearnerTrends } = require("./trend-analyzer");
const { retrieveEvidence } = require("./evidence-retriever");
const { submitTeacherReview } = require("./teacher-review");

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


server.registerTool(
  "analyze_longitudinal_trends",
  {
    title: "Analyze Longitudinal Trends",
    description:
      "Analyze a learner's educational records across multiple years to identify trends, emerging strengths and persistent difficulties.",
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

    try {
      const analysis = analyzeLearnerTrends(learner);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(analysis, null, 2)
          }
        ],
        structuredContent: {
          analysis
        }
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Unable to analyze ${learnerId}: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

server.registerTool(
  "retrieve_evidence",
  {
    title: "Retrieve Evidence",
    description:
      "Retrieve year-by-year source evidence supporting a longitudinal finding about a learner.",
    inputSchema: {
      learnerId: z.string().describe("Unique learner identifier, e.g. LRN001"),
      metric: z.enum([
        "mathematics",
        "science",
        "language",
        "attendance"
      ]).describe("Metric for which supporting evidence is required")
    }
  },
  async ({ learnerId, metric }) => {
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

    try {
      const evidence = retrieveEvidence(learner, metric);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(evidence, null, 2)
          }
        ],
        structuredContent: {
          evidence
        }
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Unable to retrieve evidence: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

server.registerTool(
  "submit_teacher_review",
  {
    title: "Submit Teacher Review",
    description:
      "Record a teacher's human review of an AI-generated educational recommendation. The teacher can approve, reject, or modify the recommendation.",
    inputSchema: {
      learnerId: z.string().describe("Unique learner identifier, e.g. LRN001"),
      recommendation: z.string().describe("Recommendation proposed by the AI agent"),
      decision: z.enum([
        "approved",
        "rejected",
        "modified"
      ]).describe("Teacher decision"),
      teacherComment: z.string().optional().describe(
        "Optional teacher explanation or modification"
      )
    }
  },
  async ({ learnerId, recommendation, decision, teacherComment }) => {
    try {
      const review = submitTeacherReview({
        learnerId,
        recommendation,
        decision,
        teacherComment
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(review, null, 2)
          }
        ],
        structuredContent: {
          review
        }
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Unable to record teacher review: ${error.message}`
          }
        ],
        isError: true
      };
    }
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






