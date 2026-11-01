"use strict";

const assert = require("node:assert/strict");
const express = require("express");
const fs = require("node:fs");

const {
  createV03SessionMiddleware
} = require("../src/session-config-v03");

const {
  createV03TeacherLoginRouter
} = require("../src/teacher-login-router-v03");

const {
  createV03LearnerRouter
} = require("../src/learner-router-v03");

const {
  pool: pedagogicalPool
} = require("../src/db/postgres-pedagogical-v03");

const {
  pool: loginPool
} = require("../src/db/postgres-v03");

async function main() {
  const app = express();
  let server;

  try {
    app.use(express.json({ limit: "64kb" }));
    app.use("/api/v03", createV03SessionMiddleware());
    app.use("/api/v03", createV03TeacherLoginRouter());
    app.use("/api/v03", createV03LearnerRouter());

    server = await new Promise((resolve, reject) => {
      const instance = app.listen(0, "127.0.0.1");
      instance.once("listening", () => resolve(instance));
      instance.once("error", reject);
    });

    const base = `http://127.0.0.1:${server.address().port}`;

    const encoded = fs.readFileSync(0, "utf8").trim();
    const password = Buffer.from(encoded, "base64").toString("utf8");

    const loginResponse = await fetch(`${base}/api/v03/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "ENS-DEMO-001",
        password
      })
    });

    assert.equal(loginResponse.status, 200);

    const loginBody = await loginResponse.json();
    assert.equal(loginBody.teacher?.id_enseignant, 1);

    const cookie = loginResponse.headers.get("set-cookie") || "";
    const sessionCookie = cookie.split(";")[0];

    assert.ok(sessionCookie, "Cookie de session absent.");

    const learners = [
      "LRN001",
      "LRN002",
      "LRN003",
      "LRN004",
      "LRN005"
    ];

    for (const learnerId of learners) {
      const response = await fetch(
        `${base}/api/v03/learners/${learnerId}`,
        { headers: { Cookie: sessionCookie } }
      );

      assert.equal(
        response.status,
        200,
        `Acces refuse pour ${learnerId}`
      );

      const body = await response.json();

      assert.equal(body.success, true);
      assert.ok(body.learner, `Fiche absente : ${learnerId}`);

      const actualId = String(
        body.learner.id_apprenant ||
        body.learner.learnerId ||
        body.learner.id ||
        ""
      );

      assert.equal(actualId, learnerId);

      console.log(`OK HTTP 200 : ${learnerId}`);
    }

    console.log(
      "SUCCES : 5/5 fiches pedagogiques autorisees."
    );
  } finally {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }

    await Promise.allSettled([
      pedagogicalPool.end(),
      loginPool.end()
    ]);
  }
}

main().catch(error => {
  console.error("ECHEC :", error.message);
  process.exitCode = 1;
});