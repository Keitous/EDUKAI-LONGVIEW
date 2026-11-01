BEGIN;

-- PROTECTION : base V0.3 exclusivement
DO $$
BEGIN
    IF current_database() <> 'edukai_longview_v03' THEN
        RAISE EXCEPTION
            'EDUKAI V0.3 : execution interdite sur la base %',
            current_database();
    END IF;
END
$$;
-- EDUKAI AFRICA V0.3
-- PROJET DE STRUCTURE : NE PAS EXECUTER AVANT VALIDATION

CREATE TABLE edukai.compte_utilisateur (
    id_compte UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    id_enseignant BIGINT NOT NULL UNIQUE
        REFERENCES edukai.enseignant(id_enseignant),

    identifiant_connexion VARCHAR(150) NOT NULL UNIQUE,

    mot_de_passe_hash TEXT NOT NULL,

    actif BOOLEAN NOT NULL DEFAULT TRUE,

    date_creation TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    derniere_connexion TIMESTAMPTZ,

    CONSTRAINT chk_compte_identifiant_non_vide
        CHECK (length(trim(identifiant_connexion)) > 0),

    CONSTRAINT chk_compte_hash_non_vide
        CHECK (length(trim(mot_de_passe_hash)) > 0)
);

-- SECURITE : aucun acces public aux comptes utilisateurs
REVOKE ALL ON TABLE edukai.compte_utilisateur FROM PUBLIC;
COMMIT;
