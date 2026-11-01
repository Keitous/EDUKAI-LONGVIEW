"use strict";

const assert = require("node:assert/strict");
const express = require("express");

const servicePath = require.resolve(
  "../src/pedagogical-translation-service-v03"
);
const routerPath = require.resolve(
  "../src/pedagogical-translation-router-v03"
);

const service = require(servicePath);

service.translatePedagogicalBatch = async ({
  texts,
  sourceLanguage,
  targetLanguage
}) => texts.map(text => ({
  original: text,
  translated: `MOCK:${text}`,
  sourceLanguage,
  targetLanguage,
  translatedBy: "mock"
}));

delete require.cache[routerPath];

const {
  createPedagogicalTranslationRouter
} = require(routerPath);

async function main() {
  const app = express();

  app.use(express.json());

  const requireAuthenticatedTeacher = (req, res, next) => {
    if (req.get("x-test-teacher") !== "yes") {
      return res.status(401).json({
        error: "Authentification requise."
      });
    }

    next();
  };

  const requireTrustedWriteOrigin = (req, res, next) => {
    if (req.get("x-test-origin") !== "trusted") {
      return res.status(403).json({
        error: "Origine non autorisee."
      });
    }

    next();
  };

  app.use(
    "/api/v03",
    createPedagogicalTranslationRouter(
      requireAuthenticatedTeacher,
      requireTrustedWriteOrigin
    )
  );

  const server = app.listen(0, "127.0.0.1");

  try {
    await new Promise(resolve => {
      if (server.listening) return resolve();
      server.once("listening", resolve);
    });

    const address = server.address();
    const url =
      `http://127.0.0.1:${address.port}/api/v03/translate-batch`;

    const validBody = {
      texts: ["Progression de 25 points."],
      sourceLanguage: "fr",
      targetLanguage: "en"
    };

    async function post(body, teacher, origin) {
      const headers = {
        "content-type": "application/json"
      };

      if (teacher) headers["x-test-teacher"] = "yes";
      if (origin) headers["x-test-origin"] = "trusted";

      return fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });
    }

    const unauthenticated = await post(validBody, false, true);
    assert.equal(unauthenticated.status, 401);
    console.log("PASS 1 - Enseignant non authentifie : 401");

    const untrusted = await post(validBody, true, false);
    assert.equal(untrusted.status, 403);
    console.log("PASS 2 - Origine non autorisee : 403");

    const invalid = await post({
      texts: [],
      sourceLanguage: "fr",
      targetLanguage: "en"
    }, true, true);

    assert.equal(invalid.status, 400);
    console.log("PASS 3 - Lot invalide : 400");

    const forbidden = await post({
      texts: ["Commentaire confidentiel non autorise."],
      sourceLanguage: "fr",
      targetLanguage: "en"
    }, true, true);

    assert.equal(forbidden.status, 403);
    console.log("PASS 4 - Texte non autorise : 403");

    const valid = await post(validBody, true, true);
    assert.equal(valid.status, 200);

    const result = await valid.json();

    assert.equal(result.success, true);
    assert.equal(result.syntheticData, true);
    assert.equal(
      result.results[0].translated,
      "MOCK:Progression de 25 points."
    );

    console.log("PASS 5 - Traduction simulee : 200");
    console.log("EDUKAI V0.3 - TESTS HTTP REUSSIS");
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error("ECHEC TEST HTTP :", error);
  process.exitCode = 1;
});