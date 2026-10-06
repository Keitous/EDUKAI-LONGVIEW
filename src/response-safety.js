const UNSUPPORTED_CAUSAL_PATTERNS = [
  /porte(?:nt)?\s+(?:ses|leurs)\s+fruits/i,
  /strat[eé]gie[s]?\s+(?:est|sont)\s+efficace/i,
  /support\s+(?:is|was)\s+working/i,
  /strategy\s+(?:is|was)\s+working/i,
  /intervention\s+(?:caused|produced)/i
];

const UNSUPPORTED_SCHEDULE_PATTERNS = [
  /\bchaque\s+semaine\b/i,
  /\bchaque\s+mois\b/i,
  /\btous\s+les\s+deux\s+mois\b/i,
  /\bchaque\s+trimestre\b/i,
  /\bchaque\s+semestre\b/i,
  /\bfin\s+du\s+trimestre\b/i,
  /\bfin\s+du\s+semestre\b/i,
  /\bevery\s+week\b/i,
  /\bevery\s+month\b/i,
  /\bevery\s+two\s+months\b/i,
  /\bevery\s+term\b/i,
  /\bevery\s+trimester\b/i,
  /\bevery\s+semester\b/i
];

function matchesAny(text, patterns) {
  return patterns.some(
    (pattern) => pattern.test(text)
  );
}

function checkResponseSafety(text) {
  const responseText = String(text || "");

  const violations = [];

  if (
    matchesAny(
      responseText,
      UNSUPPORTED_CAUSAL_PATTERNS
    )
  ) {
    violations.push({
      type: "unsupported_causal_claim",
      message:
        "The response may contain an unsupported causal claim."
    });
  }

  if (
    matchesAny(
      responseText,
      UNSUPPORTED_SCHEDULE_PATTERNS
    )
  ) {
    violations.push({
      type: "unsupported_followup_schedule",
      message:
        "The response may contain a follow-up schedule not supported by evidence."
    });
  }

  return {
    safe: violations.length === 0,
    violations
  };
}

module.exports = {
  checkResponseSafety
};