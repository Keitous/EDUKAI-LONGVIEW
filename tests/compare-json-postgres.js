
const { spawnSync } = require("node:child_process");

const script = `
const { getAllLearners } = require("./src/data/learner-store");

getAllLearners()
  .then(learners => {
    process.stdout.write(
      "DATA_RESULT=" + JSON.stringify(learners) + "\\n"
    );
  })
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (process.env.DATA_SOURCE === "postgres") {
      const { pool } = require("./src/db/postgres");
      await pool.end();
    }
  });
`;
function loadLearners(source) {
  const result = spawnSync(process.execPath, ["-e", script], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATA_SOURCE: source
    },
    encoding: "utf8",
    timeout: 15000
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `Echec ${source}: ${result.stderr || "Erreur inconnue"}`
    );
  }

  const line = result.stdout
    .split(/\r?\n/)
    .find(value => value.startsWith("DATA_RESULT="));

  if (!line) {
    throw new Error(`Aucune donnée reçue depuis ${source}`);
  }

  return JSON.parse(line.substring("DATA_RESULT=".length));
}

function normalize(learners) {
  return learners
    .map(learner => ({
      ...learner,
      records: [...learner.records].sort(
        (a, b) => a.year.localeCompare(b.year)
      )
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

try {
  const jsonLearners = loadLearners("json");
  const pgLearners = loadLearners("postgres");

  const identical =
    JSON.stringify(normalize(jsonLearners)) ===
    JSON.stringify(normalize(pgLearners));

  console.log("Apprenants JSON       :", jsonLearners.length);
  console.log("Apprenants PostgreSQL :", pgLearners.length);
  console.log("Donnees identiques    :", identical);

  if (!identical) {
    console.error("ATTENTION : des différences ont été détectées.");
    process.exitCode = 1;
  }
} catch (error) {
  console.error("ERREUR :", error.message);
  process.exitCode = 1;
}
