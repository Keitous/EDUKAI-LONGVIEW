"use strict";

const { pool } = require("./postgres-pedagogical-v03");

const V03_DATABASE = "edukai_longview_v03";

function verifyV03Configuration() {
  if (
    pool.options.database !== V03_DATABASE ||
    pool.options.user !== "edukai_app"
  ) {
    throw new Error(
      "EDUKAI V0.3 : configuration pedagogique non autorisee."
    );
  }
}

async function verifyV03Database(client) {
  const result = await client.query(
    "SELECT current_database() AS database_name"
  );

  const databaseName = result.rows[0]?.database_name;

  if (databaseName !== V03_DATABASE) {
    throw new Error(
      `EDUKAI V0.3: connexion refusee vers ${databaseName}. ` +
      `Base autorisee: ${V03_DATABASE}.`
    );
  }

  return databaseName;
}

async function testV03Connection() {
  verifyV03Configuration();

  const client = await pool.connect();

  try {
    const databaseName = await verifyV03Database(client);

    return {
      success: true,
      database: databaseName,
      message: "Connexion EDUKAI V0.3 verifiee."
    };
  } finally {
    client.release();
  }
}

async function withV03Transaction(operation) {
  if (typeof operation !== "function") {
    throw new TypeError("Une fonction de transaction est requise.");
  }

  verifyV03Configuration();

  const client = await pool.connect();

  try {
    await verifyV03Database(client);
    await client.query("BEGIN");

    try {
      const result = await operation(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } finally {
    client.release();
  }
}

module.exports = {
  verifyV03Configuration,
  verifyV03Database,
  testV03Connection,
  withV03Transaction
};
