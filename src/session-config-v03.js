"use strict";
// EDUKAI_CLOUD_PATCH_V1
if (process.env.EDUKAI_V03_MODE === "nairobi_cloud") {
const { pool } =
    require("./db/postgres-v03");

const { createCloudSessionMiddleware } =
    require("./nairobi-cloud-session");

function createV03SessionMiddleware() {
    return createCloudSessionMiddleware(pool);
}

module.exports = { createV03SessionMiddleware };
} else {
"use strict";

const { assertV03Database, getV03DatabaseMode } = require("./v03-database-mode");

const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const session = require("express-session");

function createV03SessionMiddleware() {
  const envPath = path.resolve(
  __dirname,
  getV03DatabaseMode().mode === "jury"
    ? "../.env.v03.jury"
    : getV03DatabaseMode().mode === "tests_grandeur_nature"
      ? "../.env.v03.tests-grandeur-nature"
      : getV03DatabaseMode().mode === "nairobi_reset_test"
        ? "../.env.v03.nairobi-reset-test"
        : "../.env.v03"
);

  const config = dotenv.parse(
    fs.readFileSync(envPath)
  );

  assertV03Database(config.PGDATABASE);

  if (config.PGUSER !== "edukai_auth_login") {
    throw new Error(
      "EDUKAI V0.3 : configuration non autorisee."
    );
  }

  const secret = config.EDUKAI_SESSION_SECRET;

  if (
    typeof secret !== "string" ||
    !/^[0-9a-f]{128}$/.test(secret)
  ) {
    throw new Error(
      "EDUKAI V0.3 : secret de session invalide."
    );
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "EDUKAI V0.3 : stockage persistant des sessions requis en production."
    );
  }

  return session({
    name: getV03DatabaseMode().mode === "jury"
      ? "edukai.v03.jury.sid"
      : getV03DatabaseMode().mode === "tests_grandeur_nature"
        ? "edukai.v03.tests.sid"
        : getV03DatabaseMode().mode === "nairobi_reset_test"
          ? "edukai.v03.nairobi.sid"
          : "edukai.v03.sid",
    secret,
    resave: false,
    saveUninitialized: false,
    rolling: getV03DatabaseMode().mode === "nairobi_reset_test",
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 30 * 60 * 1000,
      path: "/api/v03"
    }
  });
}

module.exports = {
  createV03SessionMiddleware
};

}
