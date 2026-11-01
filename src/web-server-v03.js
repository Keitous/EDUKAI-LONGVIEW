"use strict";

const { createV03App } = require("./web-app-v03");
const { loadV03HttpConfig } = require("./http-config-v03");

const {
  testV03Connection
} = require("./db/pedagogical-review-repository");

const {
  pool: pedagogicalPool
} = require("./db/postgres-pedagogical-v03");

async function main() {
  const config = loadV03HttpConfig();

  if (config.storage !== "postgres_v03") {
    throw new Error(
      "EDUKAI V0.3 : mode de stockage non autorise."
    );
  }

  const verification = await testV03Connection();

  console.log(
    "EDUKAI V0.3 - Base verifiee :",
    verification.database
  );

  const app = createV03App();

  const server = app.listen(3003, "127.0.0.1", () => {
    console.log(
      "EDUKAI V0.3 - Serveur HTTP local : http://127.0.0.1:3003"
    );
  });

  let stopping = false;

  async function shutdown() {
    if (stopping) return;
    stopping = true;

    console.log("EDUKAI V0.3 - Arret en cours.");

    try {
      await new Promise((resolve, reject) => {
        server.close(error => {
          if (error) reject(error);
          else resolve();
        });
      });

      await pedagogicalPool.end();

      console.log("EDUKAI V0.3 - Arret termine.");
    } catch (error) {
      console.error(
        "EDUKAI V0.3 - Erreur a l'arret :",
        error.message
      );
      process.exitCode = 1;
    }
  }

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  return server;
}

if (require.main === module) {
  main().catch(error => {
    console.error(
      "EDUKAI V0.3 - Demarrage refuse :",
      error.message
    );
    pedagogicalPool.end()
      .catch(() => {})
      .finally(() => {
        process.exitCode = 1;
      });
  });
}

module.exports = { main };
