require("dotenv").config();

function getLLMConfig() {
  const provider = (process.env.LLM_PROVIDER || "").toLowerCase();
  const model = process.env.LLM_MODEL || "";

  const providers = {
    mistral: "MISTRAL_API_KEY",
    openai: "OPENAI_API_KEY",
    groq: "GROQ_API_KEY",
    openrouter: "OPENROUTER_API_KEY"
  };

  if (!provider) {
    return {
      configured: false,
      reason: "No LLM provider configured.",
      provider: null,
      model: null
    };
  }

  if (!providers[provider]) {
    throw new Error(
      `Unsupported LLM provider: ${provider}. Supported providers: ${Object.keys(providers).join(", ")}`
    );
  }

  const keyVariable = providers[provider];
  const apiKey = process.env[keyVariable];

  if (!apiKey) {
    return {
      configured: false,
      reason: `${keyVariable} is not configured.`,
      provider,
      model: model || null
    };
  }

  return {
    configured: true,
    provider,
    model: model || null,
    apiKey
  };
}

module.exports = {
  getLLMConfig
};
