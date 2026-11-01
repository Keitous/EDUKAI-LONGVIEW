"use strict";

const express = require("express");
const {
  canTeacherAccessLearner
} = require("./pedagogical-access-v03");

const {
  getAllLearners,
  getLearnerById
} = require("./data/learner-store-v03");

const {
  analyzeLearner
} = require("./longitudinal-service-v03");

const {
  recommendForLearner
} = require("./pedagogical-recommendation-service-v03");

function requireAuthenticatedTeacher(req, res, next) {
  const auth = req.session?.auth;

  if (
    !auth ||
    auth.verifiedByServer !== true ||
    auth.role !== "enseignant" ||
    !Number.isSafeInteger(auth.id_enseignant) ||
    auth.id_enseignant <= 0
  ) {
    return res.status(401).json({
      error: "Authentification enseignant requise."
    });
  }

  next();
}

function createV03LearnerRouter() {
  const router = express.Router();

  router.use("/learners", requireAuthenticatedTeacher);

  router.get("/learners", async (req, res, next) => {
    try {
      const allLearners = await getAllLearners();
      const teacherId = req.session?.auth?.id_enseignant;

      const learners = allLearners.filter(learner => {
        const learnerId = String(
          learner.id_apprenant ||
          learner.learnerId ||
          learner.id ||
          ""
        );

        return canTeacherAccessLearner(teacherId, learnerId);
      });

      return res.status(200).json({
        success: true,
        count: learners.length,
        learners
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/learners/:id/recommendations", async (req, res, next) => {
    try {
      const id = req.params.id;

      if (!/^LRN[0-9]{3,10}$/.test(id)) {
        return res.status(400).json({
          error: "Identifiant apprenant invalide."
        });
      }

      const result = await recommendForLearner(id);

      if (!result) {
        return res.status(404).json({
          error: "Apprenant introuvable."
        });
      }

      return res.status(200).json({
        success: true,
        result
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/learners/:id/analysis", async (req, res, next) => {
    try {
      const id = req.params.id;

      if (!/^LRN[0-9]{3,10}$/.test(id)) {
        return res.status(400).json({
          error: "Identifiant apprenant invalide."
        });
      }

      const analysis = await analyzeLearner(id);

      if (!analysis) {
        return res.status(404).json({
          error: "Apprenant introuvable."
        });
      }

      return res.status(200).json({
        success: true,
        analysis
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/learners/:id", async (req, res, next) => {
    try {
      const id = req.params.id;

      if (!/^LRN[0-9]{3,10}$/.test(id)) {
        return res.status(400).json({
          error: "Identifiant apprenant invalide."
        });
      }

      const learner = await getLearnerById(id);

      if (!learner) {
        return res.status(404).json({
          error: "Apprenant introuvable."
        });
      }

      return res.status(200).json({
        success: true,
        learner
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = {
  createV03LearnerRouter
};
