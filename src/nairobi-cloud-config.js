"use strict";

const { Pool } = require("pg");

function getCloudDatabaseConfig() {
  const required = [
    "PGHOST",
    "PGPORT",
    "PGDATABASE",
    "PGUSER",
    "PGPASSWORD"
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Variable Render absente : ${key}`);
    }
  }

  const port = Number(process.env.PGPORT);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Port PostgreSQL invalide.");
  }

  return {
    host: process.env.PGHOST,
    port,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: process.env.PGSSLMODE === "disable"
      ? false
      : { rejectUnauthorized: true }
  };
}

function createCloudPool() {
  return new Pool({
    ...getCloudDatabaseConfig(),
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000
  });
}

module.exports = {
  getCloudDatabaseConfig,
  createCloudPool
};
