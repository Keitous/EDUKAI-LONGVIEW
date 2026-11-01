"use strict";

const express = require("express");
const fs = require("node:fs");

const {
  createV03SessionMiddleware
} = require("../src/session-config-v03");

const {
  createV03TeacherLoginRouter
} = require("../src/teacher-login-router-v03");

const {
  pool
} = require("../src/db/postgres-v03");

async function main() {
  const app = express();
  let server;

  try {
    app.use(express.json({ limit: "64kb" }));

    app.use("/api/v03", createV03SessionMiddleware());

    app.use("/api/v03", createV03TeacherLoginRouter());

    app.get("/api/v03/test-session", (req, res) => {
      if (!req.session?.auth?.verifiedByServer) {
        return res.status(401).json({
          authenticated: false
        });
      }

      return res.json({
        authenticated: true,
        role: req.session.auth.role,
        id_enseignant: req.session.auth.id_enseignant
      });
    });

    server = await new Promise((resolve, reject) => {
      const instance = app.listen(0, "127.0.0.1");
      instance.once("listening", () => resolve(instance));
      instance.once("error", reject);
    });

    const url = `http://127.0.0.1:${server.address().port}`;

    const encoded = fs.readFileSync(0, "utf8").trim();
    const password = Buffer.from(encoded, "base64").toString("utf8");

    const response = await fetch(`${url}/api/v03/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "ENS-DEMO-001",
        password
      })
    });

    const body = await response.json();
    const cookie = response.headers.get("set-cookie") || "";
    const sessionCookie = cookie.split(";")[0];

    const sessionResponse = await fetch(
      `${url}/api/v03/test-session`,
      {
        headers: { Cookie: sessionCookie }
      }
    );

    const sessionBody = await sessionResponse.json();

    const checks = {
      "Connexion HTTP": response.status === 200,
      "Identite enseignant":
        body.teacher?.id_enseignant === 1 &&
        body.teacher?.role === "enseignant",
      "Cookie HttpOnly": /;\s*HttpOnly/i.test(cookie),
      "Cookie SameSite Strict": /;\s*SameSite=Strict/i.test(cookie),
      "Session conservee":
        sessionResponse.status === 200 &&
        sessionBody.authenticated === true &&
        sessionBody.id_enseignant === 1,
      "Aucun mot de passe dans la reponse":
        !Object.hasOwn(body, "password") &&
        !Object.hasOwn(body.teacher || {}, "mot_de_passe_hash")
    };

    for (const [name, valid] of Object.entries(checks)) {
      console.log(`${name} : ${valid ? "OK" : "ECHEC"}`);
    }

    const success = Object.values(checks).every(Boolean);

    console.log(
      "TEST GLOBAL CONNEXION HTTP V0.3 :",
      success ? "OK" : "ECHEC"
    );

    if (!success) process.exitCode = 1;

  } catch (error) {
    console.error("TEST GLOBAL CONNEXION HTTP V0.3 : ECHEC");
    console.error(error.message);
    process.exitCode = 1;

  } finally {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
    await pool.end();
  }
}

main();
