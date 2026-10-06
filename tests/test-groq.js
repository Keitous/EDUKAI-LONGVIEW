const Groq = require("groq-sdk");
const { getLLMConfig } = require("../src/llm-config");

async function main() {
  const config = getLLMConfig();

  if (!config.configured) {
    throw new Error("LLM configuration is incomplete.");
  }

  if (config.provider !== "groq") {
    throw new Error(`This test expects Groq, received: ${config.provider}`);
  }

  const groq = new Groq({
    apiKey: config.apiKey
  });

  console.log("=== GROQ CONNECTION TEST ===");
  console.log(`Provider: ${config.provider}`);
  console.log(`Model: ${config.model}`);

  const completion = await groq.chat.completions.create({
    model: config.model,
    messages: [
      {
        role: "system",
        content:
          "You are a connection test for EDUKAI AFRICA LongView Agent. Reply briefly."
      },
      {
        role: "user",
        content:
          "Reply exactly with: EDUKAI LONGVIEW LLM READY"
      }
    ],
    temperature: 0
  });

  console.log("\n=== LLM RESPONSE ===");
  console.log(completion.choices[0].message.content);
}

main().catch((error) => {
  console.error("\nGROQ TEST FAILED:");
  console.error(error.message || error);
  process.exit(1);
});
