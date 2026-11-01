"use strict";

const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const { Pool } = require("pg");

const envPath = path.resolve(
  __dirname,
  "../../.env.pedagogical-v03"
);

const config = dotenv.parse(
  fs.readFileSync(envPath)
);

for (const key of [
  "PGHOST",
  "PGPORT",
  "PGDATABASE",
  "PGUSER",
  "PGPASSWORD"
]) {
  if (
    typeof config[key] !== "string" ||
    config[key].trim() === ""
  ) {
    throw new Error(
      `EDUKAI pedagogie V0.3 : parametre absent (${key}).`
    );
  }
}

if (config.PGDATABASE !== "edukai_longview_v03") {
  throw new Error(
    "EDUKAI pedagogie V0.3 : base non autorisee."
  );
}

if (config.PGUSER !== "edukai_app") {
  throw new Error(
    "EDUKAI pedagogie V0.3 : utilisateur non autorise."
  );
}

const port = Number(config.PGPORT);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(
    "EDUKAI pedagogie V0.3 : port invalide."
  );
}

const pool = new Pool({
  host: config.PGHOST,
  port,
  database: config.PGDATABASE,
  user: config.PGUSER,
  password: config.PGPASSWORD,
  ssl: config.PGSSLMODE === "disable"
    ? false
    : { rejectUnauthorized: true },
  max: 5,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});

pool.on("error", (error) => {
  console.error(
    "[EDUKAI pedagogie V0.3] Connexion inactive :",
    error.message
  );
});

module.exports = { pool };
