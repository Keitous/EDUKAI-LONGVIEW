"use strict";

const { Pool } = require("pg");

const {
  loadV03DatabaseConfig
} = require("../db-config-v03");

const config = loadV03DatabaseConfig();

if (config.user !== "edukai_auth_login") {
  throw new Error(
    "EDUKAI V0.3 : role d'authentification incorrect."
  );
}

const pool = new Pool({
  ...config,
  max: 5,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});

pool.on("error", (error) => {
  console.error(
    "[EDUKAI V0.3 Auth] Connexion inactive :",
    error.message
  );
});

module.exports = { pool };
