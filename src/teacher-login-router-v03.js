"use strict";

const express = require("express");

const {
  authenticateTeacher
} = require("./teacher-login-service-v03");

const {
  createV03LoginRateLimiter
} = require("./login-rate-limit-v03");

function createV03TeacherLoginRouter() {
  const router = express.Router();

  router.post(
    "/login",
    createV03LoginRateLimiter(),
    async (req, res, next) => {
      try {
        const { identifier, password } = req.body || {};

        if (
          typeof identifier !== "string" ||
          typeof password !== "string" ||
          identifier.length < 1 ||
          identifier.length > 150 ||
          Buffer.byteLength(password, "utf8") > 1024
        ) {
          return res.status(400).json({
            error: "Requete de connexion invalide."
          });
        }

        const identity = await authenticateTeacher(
          identifier,
          password
        );

        if (!identity) {
          return res.status(401).json({
            error: "Identifiants incorrects."
          });
        }

        if (!req.session) {
          throw new Error(
            "EDUKAI V0.3 : session indisponible."
          );
        }

        req.session.regenerate(error => {
          if (error) return next(error);

          req.session.auth = {
            verifiedByServer: true,
            role: "enseignant",
            id_enseignant: identity.id_enseignant,
            identifiant_connexion:
              identity.identifiant_connexion
          };

          req.session.save(error => {
            if (error) return next(error);

            return res.status(200).json({
              authenticated: true,
              teacher: {
                id_enseignant: identity.id_enseignant,
                identifiant_connexion:
                  identity.identifiant_connexion,
                role: "enseignant"
              }
            });
          });
        });

      } catch (error) {
        next(error);
      }
    }
  );

  router.get("/session", (req, res) => {
    const auth = req.session?.auth;

    if (
      !auth ||
      auth.verifiedByServer !== true ||
      auth.role !== "enseignant" ||
      !auth.id_enseignant ||
      !auth.identifiant_connexion
    ) {
      return res.status(401).json({
        authenticated: false,
        error: "Authentification enseignant requise."
      });
    }

    return res.status(200).json({
      authenticated: true,
      teacher: {
        id_enseignant: auth.id_enseignant,
        identifiant_connexion: auth.identifiant_connexion,
        role: "enseignant"
      }
    });
  });
  router.post("/logout", (req, res, next) => {
    const origin = req.get("origin");

    if (origin) {
      let parsed;

      try {
        parsed = new URL(origin);
      } catch {
        return res.status(403).json({
          error: "Origine de requete invalide."
        });
      }

      const mode = process.env.EDUKAI_V03_MODE || "normal";
      const origines = {
        normal: "http://127.0.0.1:3003",
        jury: "http://127.0.0.1:3004",
        tests_grandeur_nature: "http://127.0.0.1:3005",
        nairobi_reset_test: "http://127.0.0.1:3006"
      };

      if (!origines[mode] || parsed.origin !== origines[mode]) {
        return res.status(403).json({
          error: "Origine non autorisee."
        });
      }
    }

    if (!req.session) {
      return res.status(401).json({
        error: "Session indisponible."
      });
    }

    req.session.destroy(error => {
      if (error) return next(error);

      const mode = process.env.EDUKAI_V03_MODE || "normal";

      const cookieName =
        mode === "tests_grandeur_nature"
          ? "edukai.v03.tests.sid"
          : mode === "jury"
            ? "edukai.v03.jury.sid"
            : mode === "nairobi_reset_test"
              ? "edukai.v03.nairobi.sid"
              : "edukai.v03.sid";

      res.clearCookie(cookieName, {
        path: "/api/v03",
        httpOnly: true,
        secure: false,
        sameSite: "strict"
      });

      return res.status(200).json({
        authenticated: false,
        loggedOut: true
      });
    });
  });
  return router;
}

module.exports = {
  createV03TeacherLoginRouter
};
