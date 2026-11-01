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

  return router;
}

module.exports = {
  createV03TeacherLoginRouter
};
