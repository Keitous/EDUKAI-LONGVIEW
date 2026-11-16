"use strict";
// EDUKAI_CLOUD_PATCH_V1
if (process.env.EDUKAI_V03_MODE === "nairobi_cloud") {
const { getCloudDatabaseConfig } =
    require("./nairobi-cloud-config");

const { assertV03Database } =
    require("./v03-database-mode");

function loadV03DatabaseConfig() {
    const config = getCloudDatabaseConfig();
    assertV03Database(config.database);
    return Object.freeze(config);
}

module.exports = { loadV03DatabaseConfig };
} else {
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const { assertV03Database, getV03DatabaseMode } = require("./v03-database-mode");

function loadV03DatabaseConfig() {
  const envPath = path.resolve(
    __dirname,
    (getV03DatabaseMode().mode === "jury"
      ? "../.env.v03.jury"
      : getV03DatabaseMode().mode === "tests_grandeur_nature"
        ? "../.env.v03.tests-grandeur-nature"
        : getV03DatabaseMode().mode === "nairobi_reset_test"
          ? "../.env.v03.nairobi-reset-test"
          : "../.env.v03")
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

  assertV03Database(values.PGDATABASE);

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

}
