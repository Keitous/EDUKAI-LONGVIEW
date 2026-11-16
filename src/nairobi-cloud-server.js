"use strict";
// EDUKAI_CLOUD_PATCH_V1

const express = require("express");
const path = require("path");

if (process.env.EDUKAI_V03_MODE !== "nairobi_cloud") {
    throw new Error("Mode cloud obligatoire.");
}

const { assertV03Database } =
    require("./v03-database-mode");

assertV03Database(process.env.PGDATABASE);

const { createV03App } =
    require("./web-app-v03");

const { pool: authPool } =
    require("./db/postgres-v03");

const { pool: pedagogicalPool } =
    require("./db/postgres-pedagogical-v03");

async function main() {
    await authPool.query("SELECT 1");
    await pedagogicalPool.query("SELECT 1");

    const app = createV03App();

    app.set("trust proxy", 1);

    const directory = path.resolve(
        __dirname,
        "../public/excellence/NAIROBI_EXCELLENCE_INTEGRATION_V03"
    );

    app.use(
        "/nairobi-excellence",
        express.static(directory, {
            index: "index.html"
        })
    );

    app.get("/", (req, res) => {
        res.redirect("/nairobi-excellence/");
    });

    app.get("/health", (req, res) => {
        res.json({
            status: "ok",
            service: "EDUKAI Nairobi Cloud",
            api: "/api/v03",
            dashboard: "/nairobi-excellence/"
        });
    });

    const port = Number(process.env.PORT || 10000);

    app.listen(port, "0.0.0.0", () => {
        console.log(
            "EDUKAI Nairobi Cloud : port " + port
        );
    });
}

main().catch(error => {
    console.error(
        "EDUKAI Nairobi Cloud :",
        error.message
    );
    process.exitCode = 1;
});