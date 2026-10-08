const { connectExternalMCP } = require("./external-mcp");
const Groq = require("groq-sdk");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const {
  StdioClientTransport
} = require("@modelcontextprotocol/sdk/client/stdio.js");
const { getLLMConfig } = require("./llm-config");
const {
  createAuditSession,
  addAuditEvent,
  saveAuditSession
} = require("./audit-logger");
const {
  checkResponseSafety
} = require("./response-safety");
function mcpToolsToGroq(mcpTools) {
  return mcpTools
    /*
     * Structural Human-in-the-Loop boundary:
     * the LLM can analyze and recommend,
     * but it cannot submit a teacher decision.
     */
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
const auditSession = createAuditSession({
  question,
  provider: config.provider,
  model: config.model
});

addAuditEvent(
  auditSession,
  "agent_started",
  {
    humanReviewRequired: true
  }
);
  if (!config.configured) {
    throw new Error("LLM configuration is incomplete.");
  }

  if (config.provider !== "groq") {
    throw new Error(
      "This agent currently requires the Groq provider."
    );
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

let externalMCP = null;

try {
  externalMCP = await connectExternalMCP();

  console.log("[EXTERNAL MCP] Filesystem server connected.");

  const availableTools = await mcpClient.listTools();
    const internalAllowedTools = new Set([
  "get_learner_profile",
  "analyze_longitudinal_trends",
  "retrieve_evidence"
]);

const groqTools = mcpToolsToGroq(
  availableTools.tools.filter(
    tool => internalAllowedTools.has(tool.name)
  )
);

groqTools.push({
  type: "function",
  function: {
    name: "read_pedagogical_guidance",
    description:
      "Read the authorized pedagogical guidance document using the external Filesystem MCP server. Use this tool before making pedagogical recommendations.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  }
});

    console.log(
      "\n=== EDUKAI AFRICA - LLM + MCP AGENT ==="
    );
    console.log(`Question: ${question}`);

    console.log(
      "\n[MCP TOOLS AVAILABLE TO LLM]"
    );

    for (const tool of groqTools) {
      console.log(`- ${tool.function.name}`);
    }

    const messages = [
      {
        role: "system",
        content: `
You are EDUKAI AFRICA LongView Agent, an educational
decision-support assistant.

Your role is to help teachers understand learner
development over time using evidence retrieved through
MCP tools.

You are NOT an autonomous educational decision-maker.

==============================
CORE EVIDENCE RULES
==============================

1. Use MCP tools whenever learner-specific data or
   evidence is required.

2. Never invent, estimate, interpolate, or assume a
   learner record that was not returned by a tool.

3. Base learner-specific conclusions only on evidence
   actually returned by the MCP tools.

4. When identifying a strength or persistent difficulty,
   retrieve supporting evidence when needed.

5. Never invent comparison data.

   In particular, NEVER claim that a learner is above or
   below:
   - a class average,
   - a school average,
   - a national average,
   - a benchmark,
   - an expected level,
   - another learner,
   unless that comparison value was explicitly returned
   by an MCP tool.

6. A score threshold produced by the LongView analysis
   may be reported as a rule used by the system, but it
   must NOT be presented as a class, school, national,
   or pedagogical norm unless such a norm exists in the
   retrieved evidence.

==============================
DATA QUALITY AND UNCERTAINTY
==============================

7. Respect dataComplete, missingYears,
   observationsUsed, and confidence when these fields
   are returned by a tool.

8. Never replace missing data with invented values.

9. If confidence is "limited", explicitly explain that
   the conclusion is based only on the available
   observations.

10. If confidence is "insufficient", do not present a
    longitudinal conclusion as established.

11. Do not describe incomplete observations as proving
    continuous improvement or continuous decline.

==============================
NO UNSUPPORTED CAUSAL CLAIMS
==============================

12. Never infer why a learner improved or declined unless
    the cause is explicitly present in retrieved evidence.

13. Do not infer diagnoses, family circumstances,
    motivation, teaching quality, socioeconomic causes,
    learning disorders, or contextual explanations from
    scores alone.

14. A correlation or temporal change must never be
    presented as a proven cause.

==============================
RECOMMENDATION SAFETY
==============================

15. You may propose cautious educational follow-up when
    the user requests recommendations.

16. Clearly separate:
    A. OBSERVED EVIDENCE
    B. INTERPRETATION
    C. OPTIONAL RECOMMENDATION

17. Recommendations are suggestions for teacher review,
    not factual findings about the learner.

18. Unless supported by retrieved evidence, do NOT invent
    precise intervention parameters such as:
    - number of minutes,
    - number of sessions,
    - group size,
    - number of weeks,
    - testing frequency,
    - target percentage,
    - deadlines,
    - specific diagnosis,
    - specific remedial curriculum.

19. When evidence does not support a precise intervention,
    use cautious language such as:
    "The teacher may consider..."
    "A possible next step is..."
    "Additional assessment may help determine..."

19A. When suggesting additional investigation, do not propose
specific possible causes that are absent from the retrieved
evidence. Ask the teacher to gather relevant contextual
information without naming hypothetical causes.

19B. Do not invent a precise follow-up frequency or timeline.
Unless a schedule is present in retrieved evidence or explicitly
provided by the user, say that follow-up timing should be
determined by the teacher.

19C. A learner's improvement does NOT prove that a teaching
     strategy, intervention, support, teacher action, or other
     external factor caused that improvement.

     Unless an MCP tool explicitly provides causal evidence,
     NEVER write or imply statements such as:
     - "the strategy is working",
     - "the support is producing results",
     - "the intervention caused the improvement",
     - "current practices are bearing fruit",
     or equivalent causal claims in any language.

     Instead, describe only the observed change.

19D. Never invent a monitoring schedule.

     Do NOT propose specific timing such as:
     - every week,
     - every month,
     - every two months,
     - every term or trimester,
     - at the end of the semester,
     unless that timing was explicitly provided by the user
     or retrieved through an MCP tool.

     If follow-up may be useful, say that the teacher should
     determine an appropriate follow-up schedule.

19E. Before producing the final answer, perform a safety
     self-check:

     - Did I infer a cause not present in MCP evidence?
     - Did I invent a comparison or benchmark?
     - Did I invent an intervention duration or frequency?
     - Did I fill in missing learner data?
     - Did I imply that a recommendation was approved or
       executed?

     If the answer to any question is yes, rewrite the
     response before returning it.
	 
20. Never claim that a recommendation has been approved,
    implemented, scheduled, or communicated.

==============================
HUMAN-IN-THE-LOOP
==============================

21. You may recommend educational follow-up, but you must
    never make or execute a consequential educational
    decision.

22. A teacher must review recommendations before action.

23. Never claim that a teacher approved anything unless
    a real human review occurred.

24. The submit_teacher_review capability is reserved for
    an explicit human-facing review workflow and must
    never be simulated by the LLM.

==============================
RESPONSE QUALITY
==============================

25. Answer in the same language as the user's question.

26. Be concise, clear, and evidence-based.

27. Clearly distinguish retrieved facts from your
    recommendations.

28. If requested information is unavailable, say that it
    is unavailable instead of guessing.

29. If a tool reports an error or that a learner does not
    exist, do not invent substitute learner information.

30. Never present a recommendation as an explanation for
    why a past improvement or decline occurred.

31. In French responses, use natural French for all
    teacher-facing explanations, tables, evidence summaries,
    source descriptions and recommendations.
    Translate technical trend labels:
    improving = en amélioration;
    stable = stable;
    declining = en régression;
    insufficient_data = données insuffisantes.
    Translate confidence labels:
    high = élevé; medium = moyen; low = faible.
    Describe persistentDifficulties as
    "difficultés persistantes".
    Use human-readable French names for MCP tools in
    narrative explanations, while preserving exact tool
    identifiers and original evidence in structured data,
    citations and audit records.
    Do not expose raw internal field names unnecessarily.
    Avoid literal Markdown formatting markers in tables.
    Never alter numerical evidence or invent sources.

Remember:
OBSERVE from evidence.
INTERPRET cautiously.
RECOMMEND optionally.
THE TEACHER DECIDES.
`
      },
      {
        role: "user",
        content: question
      }
    ];

    const maxSteps = 8;

    for (
      let step = 1;
      step <= maxSteps;
      step++
    ) {
      console.log(
        `\n[AGENT STEP ${step}] Asking LLM...`
      );

      const completion =
        await groq.chat.completions.create({
          model: config.model,
          messages,
          tools: groqTools,
          tool_choice: "auto",
          temperature: 0
        });

      const assistantMessage =
        completion.choices[0].message;

      messages.push(assistantMessage);

      /*
       * No tool call means the agent has completed
       * its reasoning and produced its final answer.
       */
      if (
        !assistantMessage.tool_calls ||
        assistantMessage.tool_calls.length === 0
      ) {
		  const safetyCheck =
  checkResponseSafety(
    assistantMessage.content
  );

if (!safetyCheck.safe) {
  console.log(
    "\n[RESPONSE SAFETY] Final response rejected."
  );

  for (
    const violation of
    safetyCheck.violations
  ) {
    console.log(
      `[SAFETY VIOLATION] ${violation.type}`
    );
  }

  addAuditEvent(
    auditSession,
    "response_safety_rejected",
    {
      step,
      violations:
        safetyCheck.violations.map(
          (item) => item.type
        )
    }
  );

  messages.push({
    role: "user",
    content: `
Your previous draft was rejected by the deterministic
EDUKAI LongView response-safety layer.

Detected violations:
${safetyCheck.violations
  .map(
    (item) =>
      `- ${item.type}: ${item.message}`
  )
  .join("\n")}

Rewrite the answer now.

Requirements:
- Preserve only evidence supported by MCP results.
- Remove unsupported causal claims.
- Remove invented monitoring schedules or timelines.
- Do not invent replacement facts.
- Keep recommendations optional.
- Teacher review remains required.
- Answer in the same language as the original user question.
`
  });

  continue;
}
        console.log(
          "\n=== FINAL AGENT RESPONSE ==="
        );

        console.log(
          assistantMessage.content
        );

        console.log(
          "\n=== HUMAN-IN-THE-LOOP ==="
        );

        console.log(
          "No consequential educational action was executed automatically."
        );

        console.log(
          "Teacher review remains required."
        );
addAuditEvent(
  auditSession,
  "agent_completed",
  {
    finalResponse: assistantMessage.content,
    humanReviewRequired: true
  }
);

saveAuditSession(
  auditSession,
  "completed"
);
        return assistantMessage.content;
      }

      for (
        const toolCall of
        assistantMessage.tool_calls
      ) {
        const toolName =
          toolCall.function.name;

        /*
         * Defense-in-depth.
         *
         * submit_teacher_review is already filtered
         * from the tools exposed to the LLM.
         * This second check protects the boundary
         * even if the filtering logic changes later.
         */
        if (
          toolName ===
          "submit_teacher_review"
        ) {
          throw new Error(
            "Safety boundary: submit_teacher_review cannot be called autonomously by the LLM."
          );
        }

        let args;

        try {
          args = JSON.parse(
            toolCall.function.arguments ||
              "{}"
          );
        } catch {
          throw new Error(
            `Invalid tool arguments generated for ${toolName}.`
          );
        }

        console.log(
          `[LLM DECISION] Call MCP tool: ${toolName}`
        );

        console.log(
          `[ARGUMENTS] ${JSON.stringify(args)}`
        );
addAuditEvent(
  auditSession,
  "mcp_tool_called",
  {
    step,
    tool: toolName,
    arguments: args
  }
);
        let toolResult;

if (toolName === "read_pedagogical_guidance") {
  if (
    !args ||
    typeof args !== "object" ||
    Array.isArray(args) ||
    Object.keys(args).length !== 0
  ) {
    throw new Error(
      "Unauthorized arguments for pedagogical guidance tool."
    );
  }

  toolResult = await externalMCP.readGuidance();

} else if (internalAllowedTools.has(toolName)) {
  toolResult = await mcpClient.callTool({
    name: toolName,
    arguments: args
  });

} else {
  throw new Error(
    `Unauthorized MCP tool requested: ${toolName}`
  );
}

        const textParts =
          (toolResult.content || [])
            .filter(
              (item) =>
                item.type === "text"
            )
            .map(
              (item) => item.text
            );

        let toolText =
          textParts.join("\n");

        /*
         * Explicitly tell the LLM when MCP reported
         * an error. This prevents a failed lookup
         * from being interpreted as valid evidence.
         */
        if (toolResult.isError) {
          toolText = JSON.stringify({
            toolError: true,
            tool: toolName,
            message:
              toolText ||
              "The MCP tool returned an error."
          });

          console.log(
            `[MCP TOOL ERROR] ${toolName}`
          );
        } else {
          console.log(
            `[MCP RESULT RECEIVED] ${toolName}`
          );
        }
addAuditEvent(
  auditSession,
  "mcp_tool_result",
  {
    step,
    tool: toolName,
    success: !toolResult.isError
  }
);
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
  try {
    if (externalMCP) {
      await externalMCP.client.close();
    }
  } finally {
    await mcpClient.close();
  }
}
}

if (require.main === module) {
  const question =
    process.argv.slice(2).join(" ") ||
    "Analyse l'évolution de l'apprenant LRN001 et explique sa principale force émergente avec les preuves.";

  runLLMAgent(question).catch(
    (error) => {
      console.error(
        "\nLLM AGENT FAILED:"
      );

      console.error(
        error.message || error
      );

      process.exit(1);
    }
  );
}

module.exports = {
  runLLMAgent
};