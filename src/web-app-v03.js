"use strict";

const express = require("express");
const helmet = require("helmet");

const {
  createV03SessionMiddleware
} = require("./session-config-v03");

const {
  loadV03HttpConfig
} = require("./http-config-v03");

const {
  createV03TeacherLoginRouter
} = require("./teacher-login-router-v03");

const {
  createV03LearnerRouter
} = require("./learner-router-v03");

const {
  createPedagogicalPublicationRouter
} = require("./pedagogical-publication-router-v03");

const {
  requireTrustedWriteOrigin
} = require("./v03-write-origin-guard");

const {
  createTeacherReviewRouter
} = require("./teacher-review-router-v03");

const {
  createPedagogicalHistoryRouter
} = require("./pedagogical-history-router-v03");

const {
  createPedagogicalTranslationRouter
} = require("./pedagogical-translation-router-v03");

function requireAuthenticatedTeacher(req, res, next) {
  const auth = req.session?.auth;

  if (
    !auth ||
    auth.verifiedByServer !== true ||
    auth.role !== "enseignant" ||
    !auth.id_enseignant
  ) {
    return res.status(401).json({
      error: "Authentification enseignant requise."
    });
  }

  next();
}

function requireTrustedWriteOriginForPublication(req, res, next) {
  if (
    req.method === "POST" &&
    /^\/learners\/LRN[0-9]{3,10}\/publish$/.test(req.path)
  ) {
    return requireTrustedWriteOrigin(req, res, next);
  }

  next();
}

function createV03App() {
  const config = loadV03HttpConfig();

  if (config.storage !== "postgres_v03") {
    throw new Error(
      "Application HTTP V0.3 refusee : mode postgres_v03 obligatoire."
    );
  }

  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "64kb" }));
  app.use("/api/v03", createV03SessionMiddleware());
  app.use("/api/v03", createV03TeacherLoginRouter());
  app.use("/api/v03", createV03LearnerRouter());

  app.use(
    "/api/v03",
    requireTrustedWriteOriginForPublication,
    createPedagogicalPublicationRouter(
      requireAuthenticatedTeacher
    )
  );

  app.use(
    "/api/v03",
    createTeacherReviewRouter(
      requireAuthenticatedTeacher,
      requireTrustedWriteOrigin
    )
  );

  app.use(
    "/api/v03",
    createPedagogicalHistoryRouter(
      requireAuthenticatedTeacher
    )
  );

  app.use(
    "/api/v03",
    createPedagogicalTranslationRouter(
      requireAuthenticatedTeacher,
      requireTrustedWriteOrigin
    )
  );
  app.get("/api/v03/health", (req, res) => {
    res.json({
      status: "ok",
      service: "EDUKAI AFRICA LongView V0.3",
      storage: "postgres_v03",
      humanReviewRequired: true,
      syntheticData: true
    });
  });

  app.use(
    "/v03",
    express.static(
      require("path").join(__dirname, "../public/v03"),
      { index: "index.html" }
    )
  );
  return app;
}

module.exports = {
  createV03App
};
