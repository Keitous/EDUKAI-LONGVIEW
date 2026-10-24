
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const jsonPath = path.resolve(
  __dirname,
  '../../data/learners.json'
);

function loadLearners() {
  const content = fs.readFileSync(jsonPath, 'utf8')
    .replace(/^\uFEFF/, '');

  const data = JSON.parse(content);
  const learners = Array.isArray(data)
    ? data
    : data.learners;

  if (!Array.isArray(learners)) {
    throw new Error('Format JSON invalide : tableau learners absent.');
  }

  return learners;
}

function validateLearners(learners) {
  const learnerIds = new Set();
  const annualKeys = new Set();
  const years = new Set();
  let annualRecords = 0;
  let missingValues = 0;

  for (const learner of learners) {
    if (!learner.id || !learner.name || !learner.country) {
      throw new Error('Identité apprenant incomplète.');
    }

    if (learnerIds.has(learner.id)) {
      throw new Error(`Apprenant en double : ${learner.id}`);
    }
    learnerIds.add(learner.id);

    if (!Array.isArray(learner.records)) {
      throw new Error(`Historique invalide : ${learner.id}`);
    }

    for (const record of learner.records) {
      if (!/^\d{4}-\d{4}$/.test(record.year || '')) {
        throw new Error(`Année invalide pour ${learner.id}`);
      }

      const key = `${learner.id}:${record.year}`;
      if (annualKeys.has(key)) {
        throw new Error(`Historique en double : ${key}`);
      }

      annualKeys.add(key);
      years.add(record.year);
      annualRecords++;

      for (const field of [
        'mathematics',
        'science',
        'language',
        'attendance'
      ]) {
        if (!Object.hasOwn(record, field)) {
          throw new Error(`Champ absent : ${key}.${field}`);
        }

        const value = record[field];

        if (value === null) {
          missingValues++;
        } else if (
          typeof value !== 'number' ||
          !Number.isFinite(value) ||
          value < 0 ||
          value > 100
        ) {
          throw new Error(`Valeur invalide : ${key}.${field}`);
        }
      }
    }
  }

  return {
    apprenants: learners.length,
    annees_scolaires: years.size,
    inscriptions: annualRecords,
    resultats_scolaires: annualRecords * 3,
    assiduites: annualRecords,
    valeurs_null: missingValues
  };
}

try {
  console.log('\nEDUKAI AFRICA V0.2');
  console.log('ETAPE 25.13 - VALIDATION AVANT MIGRATION\n');

  const learners = loadLearners();
  const report = validateLearners(learners);

  console.table([report]);

  const expected = {
    apprenants: 5,
    annees_scolaires: 3,
    inscriptions: 15,
    resultats_scolaires: 45,
    assiduites: 15,
    valeurs_null: 4
  };

  const valid = Object.entries(expected).every(
    ([key, value]) => report[key] === value
  );

  if (!valid) {
    throw new Error(
      'Les volumes ne correspondent pas au jeu de démonstration attendu.'
    );
  }

  console.log('VALIDATION REUSSIE');
  console.log('AUCUNE INSERTION EFFECTUEE DANS POSTGRESQL');
} catch (error) {
  console.error('VALIDATION ECHOUEE :', error.message);
  process.exitCode = 1;
}
