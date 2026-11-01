"use strict";

const assert = require("node:assert/strict");
const express = require("express");

const {
  createV03SessionMiddleware
} = require("../src/session-config-v03");

const {
  createV03LearnerRouter
} = require("../src/learner-router-v03");

const {
  pool
} = require("../src/db/postgres-pedagogical-v03");

async function main() {
  const app = express();
  let server;

  try {
    app.use("/api/v03", createV03SessionMiddleware());
    app.use("/api/v03", createV03LearnerRouter());

    server = await new Promise((resolve, reject) => {
      const instance = app.listen(0, "127.0.0.1");
      instance.once("listening", () => resolve(instance));
      instance.once("error", reject);
    });

    const base = `http://127.0.0.1:${server.address().port}`;

    const paths = [
      "/api/v03/learners",
      "/api/v03/learners/LRN001",
      "/api/v03/learners/LRN001/analysis",
      "/api/v03/learners/LRN001/recommendations"
    ];

    for (const path of paths) {
      const response = await fetch(base + path);

      assert.equal(
        response.status,
        401,
        `Acces non authentifie non bloque : ${path}`
      );

      console.log(`OK HTTP 401 : ${path}`);
    }

    console.log(
      "SUCCES : 4/4 tests HTTP sans authentification."
    );
  } finally {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }

    await pool.end();
  }
}

main().catch(error => {
  console.error("ECHEC :", error.message);
  process.exitCode = 1;
});