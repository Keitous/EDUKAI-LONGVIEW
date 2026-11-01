"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");

const {
  createV03App
} = require("../src/web-app-v03");

const {
  pool: pedagogicalPool
} = require("../src/db/postgres-pedagogical-v03");

const {
  pool: loginPool
} = require("../src/db/postgres-v03");

async function main() {
  let server;

  try {
    const app = createV03App();

    server = await new Promise((resolve, reject) => {
      const instance = app.listen(0, "127.0.0.1");
      instance.once("listening", () => resolve(instance));
      instance.once("error", reject);
    });

    const base = `http://127.0.0.1:${server.address().port}`;

    const anonymous = await fetch(
      `${base}/api/v03/learners/LRN001/publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: "{}"
      }
    );

    assert.equal(anonymous.status, 401);

    console.log("OK HTTP 401 : publication anonyme refusee.");

    const encoded = fs.readFileSync(0, "utf8").trim();
    const password = Buffer.from(encoded, "base64").toString("utf8");

    const login = await fetch(`${base}/api/v03/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        identifier: "ENS-DEMO-001",
        password
      })
    });

    assert.equal(login.status, 200);

    const loginBody = await login.json();

    assert.equal(loginBody.teacher?.id_enseignant, 1);

    const cookie = (login.headers.get("set-cookie") || "")
      .split(";")[0];

    assert.ok(cookie, "Cookie de session absent.");

    const checks = [
      {
        learnerId: "INVALID",
        expected: 400
      },
      {
        learnerId: "LRN999",
        expected: 403
      }
    ];

    for (const check of checks) {
      const response = await fetch(
        `${base}/api/v03/learners/${check.learnerId}/publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookie
          },
          body: "{}"
        }
      );

      assert.equal(
        response.status,
        check.expected,
        `Statut inattendu pour ${check.learnerId}`
      );

      console.log(
        `OK HTTP ${check.expected} : publication ${check.learnerId} refusee.`
      );
    }

    console.log("SUCCES : 3/3 tests HTTP de refus de publication.");
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