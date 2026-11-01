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
  createPedagogicalHistoryRouter
} = require("../src/pedagogical-history-router-v03");

const {
  pool: pedagogicalPool
} = require("../src/db/postgres-pedagogical-v03");

const {
  pool: loginPool
} = require("../src/db/postgres-v03");

function requireAuthenticatedTeacher(req, res, next) {
  const auth = req.session?.auth;

  if (
    !auth ||
    auth.verifiedByServer !== true ||
    auth.role !== "enseignant" ||
    !Number.isSafeInteger(auth.id_enseignant) ||
    auth.id_enseignant <= 0
  ) {
    return res.status(401).json({
      error: "Authentification enseignant obligatoire."
    });
  }

  next();
}

async function main() {
  const app = express();
  let server;

  try {
    app.use(express.json({ limit: "64kb" }));
    app.use("/api/v03", createV03SessionMiddleware());
    app.use("/api/v03", createV03TeacherLoginRouter());

    app.use(
      "/api/v03",
      createPedagogicalHistoryRouter(requireAuthenticatedTeacher)
    );

    server = await new Promise((resolve, reject) => {
      const instance = app.listen(0, "127.0.0.1");
      instance.once("listening", () => resolve(instance));
      instance.once("error", reject);
    });

    const base = `http://127.0.0.1:${server.address().port}`;
    const historyPath = "/api/v03/learners/LRN001/review-history";

    const anonymousResponse = await fetch(base + historyPath);

    assert.equal(anonymousResponse.status, 401);
    console.log("OK HTTP 401 : acces anonyme refuse.");

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

    const checks = [
      {
        path: "/api/v03/learners/INVALID/review-history",
        expected: 400
      },
      {
        path: "/api/v03/learners/LRN999/review-history",
        expected: 403
      },
      {
        path: historyPath,
        expected: 200
      }
    ];

    for (const check of checks) {
      const response = await fetch(base + check.path, {
        headers: { Cookie: sessionCookie }
      });

      assert.equal(
        response.status,
        check.expected,
        `Statut incorrect pour ${check.path}`
      );

      if (check.expected === 200) {
        const body = await response.json();

        assert.equal(body.success, true);
        assert.equal(body.learnerId, "LRN001");
        assert.ok(Array.isArray(body.history));
        assert.equal(body.count, body.history.length);

        console.log(
          `OK HTTP 200 : historique accessible, ${body.count} ligne(s).`
        );
      } else {
        console.log(`OK HTTP ${check.expected} : ${check.path}`);
      }
    }

    console.log("SUCCES : 4/4 tests HTTP de l'historique.");
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