
"use strict";

const { Client } = require(
  "@modelcontextprotocol/sdk/client/index.js"
);

const { StdioClientTransport } = require(
  "@modelcontextprotocol/sdk/client/stdio.js"
);

const tests = [
  {
    name: "get_learner_profile",
    arguments: { learnerId: "LRN999" }
  },
  {
    name: "analyze_longitudinal_trends",
    arguments: { learnerId: "LRN999" }
  },
  {
    name: "retrieve_evidence",
    arguments: {
      learnerId: "LRN999",
      metric: "mathematics"
    }
  }
];

async function testSource(source) {
  const client = new Client({
    name: "edukai-not-found-test",
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

  try {
    await client.connect(transport);

    for (const test of tests) {
      const result = await client.callTool({
        name: test.name,
        arguments: test.arguments
      });

      const message = result.content
        ?.filter(item => item.type === "text")
        .map(item => item.text)
        .join("\n");

      const passed =
        result.isError === true &&
        message === "Learner LRN999 was not found.";

      console.log(
        `${source} | ${test.name} | ${passed ? "OK" : "ECHEC"}`
      );

      if (!passed) {
        throw new Error(
          `Reponse inattendue : ${source} / ${test.name}`
        );
      }
    }
  } finally {
    await client.close();
  }
}

async function main() {
  await testSource("json");
  await testSource("postgres");

  console.log("BILAN : 6/6 tests reussis");
}

main().catch(error => {
  console.error("ERREUR :", error.message);
  process.exitCode = 1;
});
