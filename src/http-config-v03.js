"use strict";
// EDUKAI_CLOUD_PATCH_V1
if (process.env.EDUKAI_V03_MODE === "nairobi_cloud") {
const { assertV03Database } =
    require("./v03-database-mode");

function loadV03HttpConfig() {
    assertV03Database(process.env.PGDATABASE);

    return Object.freeze({
        database: "edukai_v03_nairobi",
        storage: "postgres_v03"
    });
}

module.exports = { loadV03HttpConfig };
} else {
"use strict";

const { assertV03Database, getV03DatabaseMode } = require("./v03-database-mode");

const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

function loadV03HttpConfig() {
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

  const values = dotenv.parse(
    fs.readFileSync(envPath)
  );

  assertV03Database(values.PGDATABASE);

  if (values.PGUSER !== "edukai_auth_login") {
    throw new Error(
      "EDUKAI V0.3 : compte technique HTTP non autorise."
    );
  }

  if (values.EDUKAI_REVIEW_STORAGE !== "postgres_v03") {
    throw new Error(
      "EDUKAI V0.3 : mode de stockage HTTP non autorise."
    );
  }

  return Object.freeze({
    database: values.PGDATABASE,
    storage: values.EDUKAI_REVIEW_STORAGE
  });
}

module.exports = {
  loadV03HttpConfig
};

}
