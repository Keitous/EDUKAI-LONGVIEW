"use strict";

const {
  withV03Transaction
} = require("./pedagogical-review-repository");

const {
  validateTeacherDecision
} = require("./teacher-review-repository");

const ACTIONS = {
  approuvee: "approbation",
  modifiee: "modification",
  rejetee: "rejet"
};

function validateId(value, name) {
  const validNumber =
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0;

  const validString =
    typeof value === "string" &&
    /^[1-9][0-9]*$/.test(value) &&
    BigInt(value) <= 9223372036854775807n;

  if (!validNumber && !validString) {
    throw new Error(`${name} invalide.`);
  }
}

async function submitPedagogicalReview(data) {
  if (
    data === null ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    throw new TypeError("Donnees de validation requises.");
  }

  const {
    id_recommandation,
    id_enseignant,
    decision,
    commentaire = null,
    contenu_modifie = null
  } = data;

  validateId(id_recommandation, "id_recommandation");
  validateId(id_enseignant, "id_enseignant");
  validateTeacherDecision(decision, contenu_modifie);

  if (commentaire !== null && typeof commentaire !== "string") {
    throw new TypeError("Commentaire invalide.");
  }

  if (
    contenu_modifie !== null &&
    typeof contenu_modifie !== "string"
  ) {
    throw new TypeError("Contenu modifie invalide.");
  }

  return withV03Transaction(async (client) => {
    const result = await client.query(
      `SELECT
          r.id_recommandation,
          r.id_analyse,
          r.contenu,
          r.statut,
          a.id_apprenant
       FROM edukai.recommandation r
       JOIN edukai.analyse_longitudinale a
         ON a.id_analyse = r.id_analyse
       WHERE r.id_recommandation = $1
       FOR UPDATE OF r`,
      [id_recommandation]
    );

    if (result.rowCount !== 1) {
      throw new Error("Recommandation introuvable.");
    }

    const rec = result.rows[0];

    if (rec.statut !== "en_attente") {
      throw new Error(
        "Recommandation deja traitee : validation refusee."
      );
    }

    const enseignant = await client.query(
      `SELECT id_enseignant
       FROM edukai.enseignant
       WHERE id_enseignant = $1
         AND actif = TRUE`,
      [id_enseignant]
    );

    if (enseignant.rowCount !== 1) {
      throw new Error("Enseignant introuvable ou inactif.");
    }

    const validation = await client.query(
      `INSERT INTO edukai.validation_enseignant
        (id_recommandation, id_enseignant, decision,
         commentaire, contenu_modifie)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_validation`,
      [
        id_recommandation,
        id_enseignant,
        decision,
        commentaire,
        decision === "modifiee"
          ? contenu_modifie.trim()
          : null
      ]
    );

    await client.query(
      `UPDATE edukai.recommandation
       SET statut = $1
       WHERE id_recommandation = $2`,
      [decision, id_recommandation]
    );

    const details = {
      decision,
      id_analyse: rec.id_analyse,
      id_apprenant: rec.id_apprenant,
      id_validation: validation.rows[0].id_validation,
      id_recommandation: rec.id_recommandation,
      validation_humaine: true,
      environnement: "EDUKAI_V03_DEMO"
    };

    if (decision === "modifiee") {
      details.contenu_original = rec.contenu;
      details.contenu_modifie = contenu_modifie.trim();
    }

    if (decision === "rejetee" && commentaire) {
      details.motif_rejet = commentaire;
    }

    const audit = await client.query(
      `INSERT INTO edukai.journal_audit
        (type_evenement, acteur_type, acteur_id,
         entite_type, entite_id, action, details)
       VALUES
        ('validation_pedagogique', 'enseignant', $1,
         'recommandation', $2, $3, $4::jsonb)
       RETURNING id_audit`,
      [
        String(id_enseignant),
        String(id_recommandation),
        ACTIONS[decision],
        JSON.stringify(details)
      ]
    );

    return {
      success: true,
      id_validation: validation.rows[0].id_validation,
      id_recommandation: rec.id_recommandation,
      statut: decision,
      id_audit: audit.rows[0].id_audit
    };
  });
}

module.exports = {
  submitPedagogicalReview
};
