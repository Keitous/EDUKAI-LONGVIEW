"use strict";

const assert = require("node:assert/strict");

const {
  translatePedagogicalBatch
} = require("../src/pedagogical-translation-service-v03");

async function main() {
  let calls = 0;

  const fakeTranslator = async ({
    text,
    sourceLanguage,
    targetLanguage
  }) => {
    calls++;

    return {
      original: text,
      translated: `EN:${text}`,
      sourceLanguage,
      targetLanguage,
      translatedBy: "mock"
    };
  };

  const original = "Progression de 25 points.";

  const first = await translatePedagogicalBatch({
    texts: [original],
    sourceLanguage: "fr",
    targetLanguage: "en",
    translateOne: fakeTranslator
  });

  assert.equal(first[0].original, original);
  assert.equal(first[0].translated, `EN:${original}`);
  assert.equal(calls, 1);
  console.log("PASS 1 - Traduction simulee FR/EN");
  console.log("PASS 2 - Texte original conserve");

  const second = await translatePedagogicalBatch({
    texts: [original],
    sourceLanguage: "fr",
    targetLanguage: "en",
    translateOne: fakeTranslator
  });

  assert.equal(second[0].translated, `EN:${original}`);
  assert.equal(second[0].translatedBy, "cache");
  assert.equal(calls, 1);
  console.log("PASS 3 - Cache fonctionnel");

  const duplicate = "Accompagnement pedagogique cible.";

  const third = await translatePedagogicalBatch({
    texts: [duplicate, duplicate],
    sourceLanguage: "fr",
    targetLanguage: "en",
    translateOne: fakeTranslator
  });

  assert.equal(third.length, 2);
  assert.equal(calls, 2);
  assert.equal(third[1].translatedBy, "cache");
  console.log("PASS 4 - Doublons evites");

  await assert.rejects(
    translatePedagogicalBatch({
      texts: ["Texte valide", 123],
      translateOne: fakeTranslator
    }),
    /Texte invalide/
  );

  await assert.rejects(
    translatePedagogicalBatch({
      texts: Array(11).fill("Texte"),
      translateOne: fakeTranslator
    }),
    /entre 1 et 10/
  );

  await assert.rejects(
    translatePedagogicalBatch({
      texts: ["Texte"],
      targetLanguage: "es",
      translateOne: fakeTranslator
    }),
    /Langue non supportee/
  );

  console.log("PASS 5 - Validation des entrees");

  const before = calls;

  const sameLanguage = await translatePedagogicalBatch({
    texts: ["Texte original"],
    sourceLanguage: "fr",
    targetLanguage: "fr",
    translateOne: fakeTranslator
  });

  assert.equal(sameLanguage[0].translated, "Texte original");
  assert.equal(calls, before);
  console.log("PASS 6 - Pas de traduction inutile");

  console.log("EDUKAI V0.3 - TESTS BATCH REUSSIS");
}

main().catch(error => {
  console.error("ECHEC TEST BATCH :", error.message);
  process.exitCode = 1;
});