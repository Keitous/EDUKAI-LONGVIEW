
"use strict";

const assert = require("node:assert/strict");

const { Client } = require(
  "@modelcontextprotocol/sdk/client/index.js"
);

const { StdioClientTransport } = require(
  "@modelcontextprotocol/sdk/client/stdio.js"
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

async function runTests(source) {
  const client = new Client({
    name: "edukai-mcp-comparator",
    version: "1.0.0"
  });

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["src/mcp-server.js"],
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATA_SOURCE: source
    }
  });

  const results = {};

  try {
    await client.connect(transport);

    for (const test of tests) {
      const response = await client.callTool({
        name: test.name,
        arguments: test.arguments
      });

      if (response.isError === true) {
        throw new Error(
          "Erreur MCP : " + test.name + " (" + source + ")"
        );
      }

      results[test.name] =
        response.structuredContent ?? response.content;
    }
  } finally {
    await client.close();
  }

  return results;
}

async function main() {
  console.log("Comparaison MCP JSON / PostgreSQL");

  const jsonResults = await runTests("json");
  console.log("Tests JSON : 3/3");

  const pgResults = await runTests("postgres");
  console.log("Tests PostgreSQL : 3/3");

  let differences = 0;

  for (const test of tests) {
    const name = test.name;

    try {
      assert.deepStrictEqual(
        jsonResults[name],
        pgResults[name]
      );

      console.log("IDENTIQUE :", name);
    } catch (error) {
      differences++;
      console.error("DIFFERENT :", name);
      console.error(error.message);
    }
  }

  console.log("Differences detectees :", differences);

  if (differences > 0) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error("ERREUR :", error.message);
  process.exitCode = 1;
});
