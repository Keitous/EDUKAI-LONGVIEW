"use strict";

const session = require("express-session");
const connectPgSimple = require("connect-pg-simple");

const PgSession = connectPgSimple(session);

function createCloudSessionMiddleware(pool) {
  const secret = process.env.EDUKAI_SESSION_SECRET;

  if (!secret || !/^[0-9a-f]{128}$/.test(secret)) {
    throw new Error("Secret de session cloud invalide.");
  }

  return session({
    name: "edukai.v03.cloud.sid",
    store: new PgSession({
      pool,
      tableName: "edukai_cloud_sessions",
      createTableIfMissing: true
    }),
    secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 30 * 60 * 1000,
      path: "/api/v03"
    }
  });
}

module.exports = {
  createCloudSessionMiddleware
};
