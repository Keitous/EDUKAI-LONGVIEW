"use strict";

const { pool } = require("./db/postgres-v03");

async function findTeacherAccount(identifier) {
  if (
    typeof identifier !== "string" ||
    identifier.length < 1 ||
    identifier.length > 150
  ) {
    return null;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN READ ONLY");

    try {
      if (process.env.EDUKAI_V03_MODE !== "nairobi_cloud") {
        await client.query("SET LOCAL ROLE edukai_auth_app");
      }

      const result = await client.query(
        `SELECT
           id_enseignant,
           identifiant_connexion,
           mot_de_passe_hash,
           actif
         FROM edukai.compte_utilisateur
         WHERE identifiant_connexion = $1
         LIMIT 1`,
        [identifier]
      );

      await client.query("COMMIT");

      return result.rows[0] || null;

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

  } finally {
    client.release();
  }
}

module.exports = {
  findTeacherAccount
};
