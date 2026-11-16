"use strict";

const NORMAL_DATABASE = "edukai_longview_v03";
const JURY_DATABASE = "edukai_longview_v03_demo_isolee";

function getV03DatabaseMode() {
    const mode = process.env.EDUKAI_V03_MODE;

    if (mode === undefined || mode === "") {
        return Object.freeze({
            mode: "normal",
            database: NORMAL_DATABASE
        });
    }

    if (mode === "nairobi_cloud") {
        return Object.freeze({
            mode: "nairobi_cloud",
            database: "edukai_v03_nairobi"
        });
    }
    if (mode === "jury") {
        return Object.freeze({
            mode: "jury",
            database: JURY_DATABASE
        });
    }

    if (mode === "tests_grandeur_nature") {
        return Object.freeze({
            mode: "tests_grandeur_nature",
            database: "edukai_longview_v03_tests_grandeur_nature"
        });
    }

    if (mode === "nairobi_reset_test") {
        return Object.freeze({
            mode: "nairobi_reset_test",
            database: "edukai_longview_v03_nairobi_reset_test"
        });
    }
    throw new Error(
        "EDUKAI V0.3 : mode de base non autorise."
    );
}

function assertV03Database(database) {
    const expected = getV03DatabaseMode();

    if (database !== expected.database) {
        throw new Error(
            "EDUKAI V0.3 : base non autorisee pour le mode actif."
        );
    }

    return expected;
}

module.exports = {
    getV03DatabaseMode,
    assertV03Database
};