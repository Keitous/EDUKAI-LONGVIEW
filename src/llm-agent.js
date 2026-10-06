const Groq = require("groq-sdk");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const { getLLMConfig } = require("./llm-config");

function mcpToolsToGroq(mcpTools) {
  return mcpTools
    .filter((tool) => tool.name !== "submit_teacher_review")
    .map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }
    }));
}

async function runLLMAgent(question) {
  const config = getLLMConfig();

  if (!config.configured) {
    throw new Error("LLM configuration is incomplete.");
  }

  if (config.provider !== "groq") {
    throw new Error("This agent currently requires the Groq provider.");
  }

  const groq = new Groq({
    apiKey: config.apiKey
  });

  const transport = new StdioClientTransport({
    command: "node",
    args: ["src/mcp-server.js"]
  });

  const mcpClient = new Client({
    name: "edukai-longview-llm-agent",
    version: "1.0.0"
  });

  await mcpClient.connect(transport);

  try {
    const availableTools = await mcpClient.listTools();
    const groqTools = mcpToolsToGroq(availableTools.tools);

    console.log("\n=== EDUKAI AFRICA - LLM + MCP AGENT ===");
    console.log(`Question: ${question}`);

    console.log("\n[MCP TOOLS AVAILABLE TO LLM]");
    for (const tool of groqTools) {
      console.log(`- ${tool.function.name}`);
    }

    const messages = [
      {
        role: "system",
        content: `
You are EDUKAI AFRICA LongView Agent, an educational decision-support assistant.

Your role is to help teachers understand learner development over time.

You have access to MCP tools.

Important rules:
1. Use tools when learner data or evidence is required.
2. Do not invent learner records.
3. Base conclusions on retrieved evidence.
4. When identifying a strength or difficulty, retrieve supporting evidence.
5. You may recommend educational follow-up, but you must never make a consequential educational decision.
6. A teacher must review recommendations before action.
7. Do not claim that a teacher approved anything unless a real human review occurred.
8. Answer in the same language as the user's question.
9. Be concise, clear, and explain the evidence behind your conclusion.
10. Never infer causes, teaching strategies, interventions, diagnoses, or contextual explanations unless they are explicitly present in retrieved evidence.
11. Clearly distinguish observed evidence from recommendations. A recommendation must never be presented as an explanation of why a past improvement occurred.
`
      },
      {
        role: "user",
        content: question
      }
    ];

    const maxSteps = 8;

    for (let step = 1; step <= maxSteps; step++) {
      console.log(`\n[AGENT STEP ${step}] Asking LLM...`);

      const completion = await groq.chat.completions.create({
        model: config.model,
        messages,
        tools: groqTools,
        tool_choice: "auto",
        temperature: 0
      });

      const assistantMessage = completion.choices[0].message;

      messages.push(assistantMessage);

      if (
        !assistantMessage.tool_calls ||
        assistantMessage.tool_calls.length === 0
      ) {
        console.log("\n=== FINAL AGENT RESPONSE ===");
        console.log(assistantMessage.content);

        console.log("\n=== HUMAN-IN-THE-LOOP ===");
        console.log(
          "No consequential educational action was executed automatically."
        );
        console.log("Teacher review remains required.");

        return assistantMessage.content;
      }

      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;

        if (toolName === "submit_teacher_review") {
          throw new Error(
            "Safety boundary: submit_teacher_review cannot be called autonomously by the LLM."
          );
        }

        let args;

        try {
          args = JSON.parse(toolCall.function.arguments || "{}");
        } catch {
          throw new Error(
            `Invalid tool arguments generated for ${toolName}.`
          );
        }

        console.log(`[LLM DECISION] Call MCP tool: ${toolName}`);
        console.log(`[ARGUMENTS] ${JSON.stringify(args)}`);

        const toolResult = await mcpClient.callTool({
          name: toolName,
          arguments: args
        });

        const textParts = (toolResult.content || [])
          .filter((item) => item.type === "text")
          .map((item) => item.text);

        const toolText = textParts.join("\n");

        console.log(`[MCP RESULT RECEIVED] ${toolName}`);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolText
        });
      }
    }

    throw new Error(
      `Agent stopped after ${maxSteps} steps to prevent an uncontrolled loop.`
    );
  } finally {
    await mcpClient.close();
  }
}

const question =
  process.argv.slice(2).join(" ") ||
  "Analyse l'évolution de l'apprenant LRN001 et explique sa principale force émergente avec les preuves.";

runLLMAgent(question).catch((error) => {
  console.error("\nLLM AGENT FAILED:");
  console.error(error.message || error);
  process.exit(1);
});

