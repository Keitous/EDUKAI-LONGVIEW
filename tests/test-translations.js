
const assert = require("node:assert/strict");
const {
  getTranslations,
  normalizeLanguage,
  supportedLanguages
} = require("../src/translations");

assert.deepEqual(
  supportedLanguages,
  ["fr", "en", "sus", "ff", "man"]
);

assert.equal(normalizeLanguage("SUS"), "sus");
assert.equal(normalizeLanguage(" FF "), "ff");

assert.throws(
  () => normalizeLanguage("unknown"),
  /Unsupported language/
);

const reference = getTranslations("fr");
const english = getTranslations("en");

assert.deepEqual(
  Object.keys(english).sort(),
  Object.keys(reference).sort()
);

for (const language of ["fr", "en"]) {
  const catalog = getTranslations(language);

  assert.ok(catalog.recommendationText.includes("{name}"));
  assert.ok(catalog.recommendationText.includes("{subject}"));
}

for (const language of ["sus", "ff", "man"]) {
  assert.throws(
    () => getTranslations(language),
    /Translations not yet available/
  );
}

console.log("PASS - Language registry");
console.log("PASS - French/English translation keys");
console.log("PASS - Recommendation placeholders");
console.log("PASS - Unverified languages remain disabled");
console.log("EDUKAI multilingual preparation tests PASSED.");
