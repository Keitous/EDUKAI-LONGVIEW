
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config({
  path: path.resolve(__dirname, '../../.env.import'),
  quiet: true
});

const expected = {
  apprenants: 5,
  annees: 3,
  etablissements: 1,
  inscriptions: 15,
  matieres: 3,
  resultats: 45,
  assiduites: 15,
  notes_null: 3,
  presences_null: 1
};

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: false,
  connectionTimeoutMillis: 5000
});

function loadLearners() {
  const filename = path.resolve(
    __dirname, '../../data/learners.json'
  );

  const text = fs.readFileSync(filename, 'utf8')
    .replace(/^\uFEFF/, '');

  const data = JSON.parse(text);
  const learners = Array.isArray(data)
    ? data
    : data.learners;

  if (!Array.isArray(learners)) {
    throw new Error('Format learners.json invalide');
  }

  const ids = new Set();
  const records = new Set();

  for (const learner of learners) {
    if (
      typeof learner.id !== 'string' ||
      !learner.id ||
      typeof learner.name !== 'string' ||
      !learner.name ||
      typeof learner.country !== 'string' ||
      !learner.country ||
      !Array.isArray(learner.records)
    ) {
      throw new Error('Identité ou historique invalide');
    }

    if (ids.has(learner.id)) {
      throw new Error('Apprenant en double : ' + learner.id);
    }
    ids.add(learner.id);

    for (const r of learner.records) {
      if (
        typeof r.year !== 'string' ||
        !/^\d{4}-\d{4}$/.test(r.year)
      ) {
        throw new Error('Année scolaire invalide');
      }

      const [start, end] = r.year.split('-').map(Number);
      if (end !== start + 1) {
        throw new Error('Année scolaire incohérente');
      }

      const key = learner.id + ':' + r.year;
      if (records.has(key)) {
        throw new Error('Historique en double : ' + key);
      }
      records.add(key);

      for (const field of [
        'mathematics', 'science',
        'language', 'attendance'
      ]) {
        if (!Object.hasOwn(r, field)) {
          throw new Error('Champ absent : ' + key + '.' + field);
        }

        const value = r[field];
        if (
          value !== null &&
          (
            typeof value !== 'number' ||
            !Number.isFinite(value) ||
            value < 0 ||
            value > 100
          )
        ) {
          throw new Error('Valeur invalide : ' + key + '.' + field);
        }
      }
    }
  }

  if (learners.length !== expected.apprenants ||
      records.size !== expected.inscriptions) {
    throw new Error('Volumes JSON inattendus');
  }

  return learners;
}

async function insertOrGet(client, insertSql, params) {
  const result = await client.query(insertSql, params);

  if (result.rows.length !== 1) {
    throw new Error('Insertion ou récupération impossible');
  }

  return result.rows[0];
}

async function main() {
  const learners = loadLearners();
  const client = await pool.connect();
  let transactionOpen = false;

  try {
    const identity = await client.query(
      'SELECT current_user AS utilisateur, current_database() AS base'
    );

    console.table(identity.rows);

    if (
      identity.rows[0].utilisateur !== 'edukai_import' ||
      identity.rows[0].base !== 'edukai_longview_dev'
    ) {
      throw new Error('Connexion à une base ou un rôle inattendu');
    }

    await client.query('BEGIN');
    transactionOpen = true;

    // Empêcher deux importations simultanées.
    await client.query(
      "SELECT pg_advisory_xact_lock(2026, 25022)"
    );

    const school = await insertOrGet(
      client,
      `WITH inserted AS (
         INSERT INTO edukai.etablissement
           (code_etablissement, nom_etablissement, pays, ville)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (code_etablissement) DO NOTHING
         RETURNING id_etablissement
       )
       SELECT id_etablissement FROM inserted
       UNION ALL
       SELECT id_etablissement
       FROM edukai.etablissement
       WHERE code_etablissement = $1
       LIMIT 1`,
      [
        'EDUKAI-DEMO',
        'Etablissement fictif EDUKAI AFRICA',
        'Guinea',
        'Conakry'
      ]
    );

    const years = [
      '2023-2024',
      '2024-2025',
      '2025-2026'
    ];

    const yearIds = new Map();

    for (const year of years) {
      const row = await insertOrGet(
        client,
        `WITH inserted AS (
           INSERT INTO edukai.annee_scolaire (libelle)
           VALUES ($1)
           ON CONFLICT (libelle) DO NOTHING
           RETURNING id_annee
         )
         SELECT id_annee FROM inserted
         UNION ALL
         SELECT id_annee
         FROM edukai.annee_scolaire
         WHERE libelle = $1
         LIMIT 1`,
        [year]
      );

      yearIds.set(year, row.id_annee);
    }

    const subjects = [
      ['MATH', 'Mathématiques', 'mathematics'],
      ['SCI', 'Sciences', 'science'],
      ['LANG', 'Langue', 'language']
    ];

    const subjectIds = new Map();

    for (const [code, name, field] of subjects) {
      const row = await insertOrGet(
        client,
        `WITH inserted AS (
           INSERT INTO edukai.matiere
             (code_matiere, nom_matiere)
           VALUES ($1, $2)
           ON CONFLICT (code_matiere) DO NOTHING
           RETURNING id_matiere
         )
         SELECT id_matiere FROM inserted
         UNION ALL
         SELECT id_matiere
         FROM edukai.matiere
         WHERE code_matiere = $1
         LIMIT 1`,
        [code, name]
      );

      subjectIds.set(field, row.id_matiere);
    }

    for (const learner of learners) {
      await client.query(
        `INSERT INTO edukai.apprenant
          (id_apprenant, nom_complet, pays, donnees_synthetiques)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (id_apprenant) DO NOTHING`,
        [learner.id, learner.name, learner.country]
      );

      for (const record of learner.records) {
        const registration = await insertOrGet(
          client,
          `WITH inserted AS (
             INSERT INTO edukai.inscription
               (id_apprenant, id_etablissement, id_annee)
             VALUES ($1, $2, $3)
             ON CONFLICT
               (id_apprenant, id_etablissement, id_annee)
             DO NOTHING
             RETURNING id_inscription
           )
           SELECT id_inscription FROM inserted
           UNION ALL
           SELECT id_inscription
           FROM edukai.inscription
           WHERE id_apprenant = $1
             AND id_etablissement = $2
             AND id_annee = $3
           LIMIT 1`,
          [
            learner.id,
            school.id_etablissement,
            yearIds.get(record.year)
          ]
        );

        for (const [, , field] of subjects) {
          await client.query(
            `INSERT INTO edukai.resultat_scolaire
               (id_inscription, id_matiere, note)
             VALUES ($1, $2, $3)
             ON CONFLICT
               (id_inscription, id_matiere)
             DO NOTHING`,
            [
              registration.id_inscription,
              subjectIds.get(field),
              record[field]
            ]
          );
        }

        await client.query(
          `INSERT INTO edukai.assiduite
             (id_inscription, taux_presence)
           VALUES ($1, $2)
           ON CONFLICT (id_inscription) DO NOTHING`,
          [registration.id_inscription, record.attendance]
        );
      }
    }

    // Vérification des données synthétiques importées.
    const report = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM edukai.apprenant)
          AS apprenants,
        (SELECT COUNT(*) FROM edukai.annee_scolaire)
          AS annees,
        (SELECT COUNT(*) FROM edukai.etablissement)
          AS etablissements,
        (SELECT COUNT(*) FROM edukai.inscription)
          AS inscriptions,
        (SELECT COUNT(*) FROM edukai.matiere)
          AS matieres,
        (SELECT COUNT(*) FROM edukai.resultat_scolaire)
          AS resultats,
        (SELECT COUNT(*) FROM edukai.assiduite)
          AS assiduites,
        (SELECT COUNT(*) FROM edukai.resultat_scolaire
         WHERE note IS NULL)
          AS notes_null,
        (SELECT COUNT(*) FROM edukai.assiduite
         WHERE taux_presence IS NULL)
          AS presences_null
    `);

    const actual = report.rows[0];
    console.table([actual]);

    for (const [key, value] of Object.entries(expected)) {
      if (Number(actual[key]) !== value) {
        throw new Error(
          `Contrôle échoué : ${key}, attendu ${value}, ` +
          `obtenu ${actual[key]}`
        );
      }
    }

    // Comparaison détaillée JSON / PostgreSQL
    const detail = await client.query(`
      SELECT
        a.id_apprenant AS id,
        a.nom_complet AS nom,
        a.pays,
        an.libelle AS annee,
        m.code_matiere AS matiere,
        r.note,
        ass.taux_presence AS presence
      FROM edukai.inscription i
      JOIN edukai.apprenant a
        ON a.id_apprenant = i.id_apprenant
      JOIN edukai.annee_scolaire an
        ON an.id_annee = i.id_annee
      JOIN edukai.resultat_scolaire r
        ON r.id_inscription = i.id_inscription
      JOIN edukai.matiere m
        ON m.id_matiere = r.id_matiere
      LEFT JOIN edukai.assiduite ass
        ON ass.id_inscription = i.id_inscription
      WHERE i.id_etablissement = $1
      ORDER BY a.id_apprenant, an.libelle, m.code_matiere
    `, [school.id_etablissement]);

    const dbValues = new Map();

    for (const row of detail.rows) {
      const key = `${row.id}:${row.annee}:${row.matiere}`;

      if (dbValues.has(key)) {
        throw new Error('Doublon PostgreSQL : ' + key);
      }

      dbValues.set(key, row);
    }

    let compared = 0;

    for (const learner of learners) {
      for (const record of learner.records) {
        for (const [code, , field] of subjects) {
          const key = `${learner.id}:${record.year}:${code}`;
          const row = dbValues.get(key);

          if (!row) {
            throw new Error('Résultat PostgreSQL absent : ' + key);
          }

          const dbNote = row.note === null
            ? null
            : Number(row.note);

          const dbPresence = row.presence === null
            ? null
            : Number(row.presence);

          if (
            row.nom !== learner.name ||
            row.pays !== learner.country ||
            dbNote !== record[field] ||
            dbPresence !== record.attendance
          ) {
            throw new Error(
              'Différence JSON / PostgreSQL : ' + key
            );
          }

          compared++;
        }
      }
    }

    if (compared !== 45 || dbValues.size !== 45) {
      throw new Error(
        'Nombre de comparaisons incorrect : ' + compared
      );
    }

    console.log(
      'COMPARAISON JSON / POSTGRESQL REUSSIE'
    );
    console.log(
      '45 notes et 15 presences verifiees, NULL conserves'
    );

  // La migration definitive exige une confirmation explicite.
    const commitRequested =
      process.argv.includes('--commit');

    if (commitRequested) {
      await client.query('COMMIT');
      transactionOpen = false;

      console.log('\nMIGRATION DEFINITIVE REUSSIE');
      console.log('COMMIT EFFECTUE');
      console.log('DONNEES ENREGISTREES DANS POSTGRESQL');
    } else {
      await client.query('ROLLBACK');
      transactionOpen = false;

      console.log('\nSIMULATION REUSSIE');
      console.log('ROLLBACK EFFECTUE');
      console.log('AUCUNE DONNEE CONSERVEE DANS POSTGRESQL');
    }

  } catch (error) {
    if (transactionOpen) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Erreur ROLLBACK :', rollbackError.message);
      }
    }

    console.error('MIGRATION ECHOUEE :', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

main()
  .catch(error => {
    console.error('ERREUR :', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
