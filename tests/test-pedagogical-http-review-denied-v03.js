"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");

const transactionPath = require.resolve(
  "../src/db/teacher-review-transaction"
);

// Protection : aucune transaction de validation ne doit s'executer.
require(transactionPath);

let writeAttempted = false;

require.cache[transactionPath].exports.submitPedagogicalReview =
  async () => {
    writeAttempted = true;
    throw new Error(
      "STOP TEST : tentative d'execution d'une validation humaine."
    );
  };

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

    const endpoint = id =>
      `${base}/api/v03/recommendations/${id}/review`;

    const anonymous = await fetch(endpoint("7"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://127.0.0.1:3003"
      },
      body: JSON.stringify({
        decision: "approuvee"
      })
    });

    assert.equal(anonymous.status, 401);
    assert.equal(writeAttempted, false);

    console.log("OK HTTP 401 : enseignant non authentifie.");

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
        id: "INVALID",
        origin: "http://127.0.0.1:3003",
        expected: 400,
        label: "identifiant invalide"
      },
      {
        id: "9223372036854775808",
        origin: "http://127.0.0.1:3003",
        expected: 400,
        label: "identifiant hors limite PostgreSQL"
      },
      {
        id: "999999999",
        origin: "http://127.0.0.1:3003",
        expected: 404,
        label: "recommandation inexistante"
      },
      {
        id: "7",
        origin: "http://site-non-autorise.invalid",
        expected: 403,
        label: "origine HTTP non autorisee"
      }
    ];

    for (const check of checks) {
      const response = await fetch(endpoint(check.id), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
          Origin: check.origin
        },
        body: JSON.stringify({
          decision: "approuvee"
        })
      });

      assert.equal(
        response.status,
        check.expected,
        `Statut incorrect : ${check.label}`
      );

      assert.equal(
        writeAttempted,
        false,
        "Une tentative d'ecriture a ete detectee."
      );

      console.log(
        `OK HTTP ${check.expected} : ${check.label}.`
      );
    }

    assert.equal(writeAttempted, false);

    console.log("SUCCES : 5/5 refus HTTP verifies.");
    console.log("Aucune fonction de validation humaine executee.");
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