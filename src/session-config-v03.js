"use strict";

const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const session = require("express-session");

function createV03SessionMiddleware() {
  const envPath = path.resolve(__dirname, "../.env.v03");

  const config = dotenv.parse(
    fs.readFileSync(envPath)
  );

  if (
    config.PGDATABASE !== "edukai_longview_v03" ||
    config.PGUSER !== "edukai_auth_login"
  ) {
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
    name: "edukai.v03.sid",
    secret,
    resave: false,
    saveUninitialized: false,
    rolling: false,
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
