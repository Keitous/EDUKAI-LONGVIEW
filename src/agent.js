const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const { getTranslations } = require("./translations");

function extractText(result) {
  const textItem = (result.content || []).find(
    (item) => item.type === "text"
  );

  if (!textItem) {
    throw new Error("No text result returned by MCP tool.");
  }

  return JSON.parse(textItem.text);
}

async function runLongViewAgent(learnerId, language = "fr") {
  const t = getTranslations(language);

  const transport = new StdioClientTransport({
    command: "node",
    args: ["src/mcp-server.js"]
  });

  const client = new Client({
    name: "edukai-longview-agent",
    version: "1.0.0"
  });

  await client.connect(transport);

  try {
    console.log(`\n=== ${t.title} ===`);
    console.log(`${t.goal} ${learnerId}`);

    console.log(`\n[${t.plan}]`);
    console.log(`1. ${t.step1}`);
    console.log(`2. ${t.step2}`);
    console.log(`3. ${t.step3}`);
    console.log(`4. ${t.step4}`);
    console.log(`5. ${t.step5}`);

    const profileResult = await client.callTool({
      name: "get_learner_profile",
      arguments: { learnerId }
    });

    const profile = extractText(profileResult);

    console.log(`\n${t.learner} : ${profile.name}`);

    const trendResult = await client.callTool({
      name: "analyze_longitudinal_trends",
      arguments: { learnerId }
    });

    const analysis = extractText(trendResult);
    const strongest = analysis.strongestImprovement;

    if (!strongest) {
      throw new Error("No strongest improvement could be identified.");
    }

    const translatedMetric = t[strongest.metric] || strongest.metric;

    console.log(`\n[${t.strongest}]`);
    console.log(
      `${translatedMetric} : ${strongest.first} -> ${strongest.last} (${strongest.change >= 0 ? "+" : ""}${strongest.change})`
    );

    const evidenceResult = await client.callTool({
      name: "retrieve_evidence",
      arguments: {
        learnerId,
        metric: strongest.metric
      }
    });

    const evidence = extractText(evidenceResult);

    console.log(`\n[${t.evidence}]`);

    for (const item of evidence.evidence) {
      console.log(`${item.year} : ${item.value}`);
    }

    const recommendation = t.recommendationText
      .replace("{name}", profile.name)
      .replace("{subject}", translatedMetric);

    console.log(`\n[${t.recommendation}]`);
    console.log(recommendation);

    console.log(`\n[${t.humanReview}]`);
    console.log(t.noAction);
    console.log(t.teacherRequired);

    return {
      learnerId,
      learnerName: profile.name,
      language,
      strongestImprovement: strongest,
      evidence: evidence.evidence,
      recommendation,
      requiresHumanReview: true
    };
  } finally {
    await client.close();
  }
}

const learnerId = process.argv[2] || "LRN001";
const language = process.argv[3] || "fr";

runLongViewAgent(learnerId, language).catch((error) => {
  console.error("\nLONGVIEW AGENT FAILED:");
  console.error(error.message || error);
  process.exit(1);
});
