"use strict";

const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

function loadV03HttpConfig() {
  const envPath = path.resolve(__dirname, "../.env.v03");

  const values = dotenv.parse(
    fs.readFileSync(envPath)
  );

  if (values.PGDATABASE !== "edukai_longview_v03") {
    throw new Error(
      "EDUKAI V0.3 : base de donnees HTTP non autorisee."
    );
  }

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
