const { connectExternalMCP } = require("../src/external-mcp");

async function main() {
  let external;

  try {
    external = await connectExternalMCP();

    console.log("External MCP connection: OK");

    const result = await external.readGuidance();

    const text = (result.content || [])
      .filter(item => item.type === "text")
      .map(item => item.text)
      .join("\n");

    if (!text.includes("Pedagogical Guidance")) {
      throw new Error("Expected pedagogical content not found.");
    }

    console.log("Guidance document retrieved: OK");
    console.log("\n=== DOCUMENT CONTENT ===");
    console.log(text);

    console.log("\nEXTERNAL MCP MODULE TEST PASSED");
  } finally {
    if (external) {
      await external.client.close();
    }
  }
}

main().catch(error => {
  console.error("EXTERNAL MCP MODULE TEST FAILED:");
  console.error(error.message);
  process.exitCode = 1;
});

