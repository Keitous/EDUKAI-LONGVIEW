"use strict";

const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

function loadV03DatabaseConfig() {
  const envPath = path.resolve(
    __dirname,
    "../.env.v03"
  );

  const values = dotenv.parse(
    fs.readFileSync(envPath)
  );

  const required = [
    "PGHOST",
    "PGPORT",
    "PGDATABASE",
    "PGUSER",
    "PGPASSWORD"
  ];

  for (const key of required) {
    if (
      typeof values[key] !== "string" ||
      values[key].trim() === ""
    ) {
      throw new Error(
        `EDUKAI V0.3 : parametre absent (${key}).`
      );
    }
  }

  if (values.PGDATABASE !== "edukai_longview_v03") {
    throw new Error(
      "EDUKAI V0.3 : base non autorisee."
    );
  }

  return Object.freeze({
    host: values.PGHOST,
    port: Number(values.PGPORT),
    database: values.PGDATABASE,
    user: values.PGUSER,
    password: values.PGPASSWORD,
    ssl: values.PGSSLMODE === "disable"
      ? false
      : { rejectUnauthorized: true }
  });
}

module.exports = {
  loadV03DatabaseConfig
};
