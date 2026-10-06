const assert = require("assert");

const {
  Client
} = require(
  "@modelcontextprotocol/sdk/client/index.js"
);

const {
  StdioClientTransport
} = require(
  "@modelcontextprotocol/sdk/client/stdio.js"
);

function extractToolResult(result) {
  if (result.isError) {
  console.error(
    "\n--- MCP ERROR DETAILS ---"
  );

  console.error(
    JSON.stringify(result, null, 2)
  );

  throw new Error(
    "MCP tool returned an error."
  );
}

  const textParts = (result.content || [])
    .filter((item) => item.type === "text")
    .map((item) => item.text);

  assert.ok(
    textParts.length > 0,
    "MCP tool should return textual evidence."
  );

  return JSON.parse(textParts.join("\n"));
}

async function main() {
  const transport =
    new StdioClientTransport({
      command: "node",
      args: ["src/mcp-server.js"]
    });

  const client = new Client({
    name: "edukai-longview-evidence-test",
    version: "1.0.0"
  });

  await client.connect(transport);

  try {
    console.log(
      "\n=== EVIDENCE RETRIEVAL TESTS ===\n"
    );

    /*
     * Scenario 1:
     * Complete longitudinal evidence.
     */
    const completeResult =
      await client.callTool({
        name: "retrieve_evidence",
        arguments: {
          learnerId: "LRN001",
          metric: "mathematics"
        }
      });

    const completeEvidence =
      extractToolResult(completeResult);

    assert.deepStrictEqual(
      completeEvidence.evidence.map(
        (item) => item.value
      ),
      [58, 71, 83]
    );

    assert.strictEqual(
      completeEvidence.first,
      58
    );

    assert.strictEqual(
      completeEvidence.last,
      83
    );

    assert.strictEqual(
      completeEvidence.change,
      25
    );

    assert.strictEqual(
      completeEvidence.dataQuality.complete,
      true
    );

    assert.deepStrictEqual(
      completeEvidence.dataQuality.missingYears,
      []
    );

    assert.strictEqual(
      completeEvidence.dataQuality.observationsUsed,
      3
    );

    assert.strictEqual(
      completeEvidence.dataQuality.confidence,
      "high"
    );

    assert.strictEqual(
      completeEvidence.syntheticData,
      true
    );

    console.log(
      "PASS - LRN001 complete evidence with high confidence"
    );

    /*
     * Scenario 2:
     * Missing first observation.
     *
     * This specifically protects against the
     * JavaScript null -> 0 coercion bug.
     */
    const incompleteResult =
      await client.callTool({
        name: "retrieve_evidence",
        arguments: {
          learnerId: "LRN005",
          metric: "science"
        }
      });

    const incompleteEvidence =
      extractToolResult(incompleteResult);

    assert.deepStrictEqual(
      incompleteEvidence.evidence.map(
        (item) => item.value
      ),
      [null, 66, 72]
    );

    /*
     * Critical regression checks:
     * null must NOT become zero and the change
     * must be 72 - 66 = 6, not 72 - 0 = 72.
     */
    assert.strictEqual(
      incompleteEvidence.first,
      66
    );

    assert.strictEqual(
      incompleteEvidence.last,
      72
    );

    assert.strictEqual(
      incompleteEvidence.change,
      6
    );

    assert.notStrictEqual(
      incompleteEvidence.change,
      72
    );

    assert.strictEqual(
      incompleteEvidence.dataQuality.complete,
      false
    );

    assert.deepStrictEqual(
      incompleteEvidence.dataQuality.missingYears,
      ["2023-2024"]
    );

    assert.strictEqual(
      incompleteEvidence.dataQuality.observationsUsed,
      2
    );

    assert.strictEqual(
      incompleteEvidence.dataQuality.confidence,
      "limited"
    );

    assert.strictEqual(
      incompleteEvidence.syntheticData,
      true
    );

    console.log(
      "PASS - LRN005 missing evidence preserved with limited confidence"
    );

    console.log(
      "\n=== EVIDENCE TEST SUMMARY ==="
    );

    console.log("Total scenarios : 2");
    console.log("Passed          : 2");
    console.log("Failed          : 0");

    console.log(
      "\nEDUKAI LongView evidence tests PASSED."
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(
    "\nEVIDENCE TEST FAILED:"
  );

  console.error(
    error.message || error
  );

  process.exit(1);
});