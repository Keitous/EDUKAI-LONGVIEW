"use strict";

require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,

  ssl: process.env.PGSSLMODE === "disable"
    ? false
    : { rejectUnauthorized: true },

  max: 5,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});

pool.on("error", (err) => {
  console.error(
    "[EDUKAI PostgreSQL] Erreur de connexion inactive :",
    err.message
  );
});

async function testConnection() {
  const result = await pool.query(`
    SELECT
      current_user AS utilisateur,
      current_database() AS base,
      COUNT(*)::integer AS nombre_apprenants
    FROM edukai.apprenant
  `);

  return result.rows[0];
}

module.exports = {
  pool,
  testConnection
};