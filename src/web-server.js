const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const {
  randomUUID
} = require("crypto");
const {
  runLLMAgent
} = require("./llm-agent");
const {
  submitTeacherReview
} = require("./teacher-review");

const app = express();

const PORT =
  process.env.PORT || 3000;

const PUBLIC_DIRECTORY =
  path.join(__dirname, "..", "public");

const LEARNERS_FILE =
  path.join(__dirname, "..", "data", "learners.json");
const analysisRegistry =
  new Map();
app.use(cors());
app.use(express.json());

app.use(
  express.static(PUBLIC_DIRECTORY)
);

function loadLearners() {
  const rawData =
  fs.readFileSync(
    LEARNERS_FILE,
    "utf8"
  );

const cleanData =
  rawData.replace(
    /^\uFEFF/,
    ""
  );

const data =
  JSON.parse(cleanData);

  return data.learners || [];
}

app.get(
  "/api/learners",
  (req, res) => {
    try {
      const learners =
        loadLearners();

      const summary =
        learners.map(
          (learner) => ({
            id: learner.id,
            name: learner.name,
            country: learner.country,
            syntheticData: true
          })
        );

      res.json({
        success: true,
        count: summary.length,
        learners: summary
      });
    } catch (error) {
      console.error(
        "Unable to load learners:",
        error.message
      );

      res.status(500).json({
        success: false,
        error:
          "Unable to load learner data."
      });
    }
  }
);
app.post(
  "/api/analyze",
  async (req, res) => {
    try {
      const learnerId =
        String(
          req.body?.learnerId || ""
        ).trim();

      const question =
        String(
          req.body?.question || ""
        ).trim();

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          error:
            "Learner ID is required."
        });
      }

      if (!question) {
        return res.status(400).json({
          success: false,
          error:
            "Question is required."
        });
      }

      const learners =
        loadLearners();

      const learner =
        learners.find(
          (item) =>
            item.id === learnerId
        );

      if (!learner) {
        return res.status(404).json({
          success: false,
          error:
            "Learner not found."
        });
      }

      const agentQuestion =
        `${question}

Selected learner ID: ${learnerId}

Use only evidence associated with this learner.`;

      const result =
        await runLLMAgent(
          agentQuestion
        );
      const analysisId =
        randomUUID();

      analysisRegistry.set(
        analysisId,
        {
          learnerId:
            learner.id,
          analysis:
            result,
          createdAt:
            new Date().toISOString()
        }
      );
      res.json({
        success: true,
		analysisId,
        learner: {
          id: learner.id,
          name: learner.name
        },
        analysis: result,
        humanReviewRequired: true,
        consequentialActionExecuted:
          false,
        syntheticData: true
      });
    } catch (error) {
      console.error(
        "LongView analysis failed:",
        error.message || error
      );

      res.status(500).json({
        success: false,
        error:
          "LongView was unable to complete the analysis."
      });
    }
  }
);
app.post(
  "/api/review",
  (req, res) => {
    try {
      const learnerId =
        String(
          req.body?.learnerId || ""
        ).trim();
      const analysisId =
        String(
          req.body?.analysisId || ""
        ).trim();
      const recommendation =
        String(
          req.body?.recommendation || ""
        ).trim();

      const decision =
        String(
          req.body?.decision || ""
        ).trim();

      const teacherComment =
        String(
          req.body?.teacherComment || ""
        ).trim();

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          error:
            "Learner ID is required."
        });
      }
            if (!analysisId) {
        return res.status(400).json({
          success: false,
          error:
            "Analysis ID is required."
        });
      }
      if (!recommendation) {
        return res.status(400).json({
          success: false,
          error:
            "Recommendation is required."
        });
      }

      const allowedDecisions = [
        "approved",
        "modified",
        "rejected"
      ];

      if (
        !allowedDecisions.includes(
          decision
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid teacher decision."
        });
      }

      const learners =
        loadLearners();

      const learner =
        learners.find(
          (item) =>
            item.id === learnerId
        );

      if (!learner) {
        return res.status(404).json({
          success: false,
          error:
            "Learner not found."
        });
      }
       const registeredAnalysis =
        analysisRegistry.get(
          analysisId
        );

      if (!registeredAnalysis) {
        return res.status(404).json({
          success: false,
          error:
            "Analysis not found."
        });
      }

      if (
        registeredAnalysis.learnerId !==
        learnerId
      ) {
        return res.status(409).json({
          success: false,
          error:
            "Analysis does not belong to this learner."
        });
      }

      if (
        registeredAnalysis.analysis !==
        recommendation
      ) {
        return res.status(409).json({
          success: false,
          error:
            "Recommendation does not match the registered analysis."
        });
      }
      const review =
        submitTeacherReview({
          learnerId,
          recommendation,
          decision,
          teacherComment
        });

      res.json({
        success: true,
        review,
        humanReviewed: true,
        consequentialActionExecuted:
          false
      });
    } catch (error) {
      console.error(
        "Teacher review failed:",
        error.message || error
      );

      res.status(500).json({
        success: false,
        error:
          "Unable to record teacher review."
      });
    }
  }
);
app.get(
  "/api/health",
  (req, res) => {
    res.json({
      status: "ok",
      service:
        "EDUKAI AFRICA LongView Web API",
      humanReviewRequired: true,
      syntheticData: true
    });
  }
);

if (require.main === module) {
  app.listen(
    PORT,
    () => {
      console.log(
        `EDUKAI AFRICA LongView Web API running on http://localhost:${PORT}`
      );
    }
  );
}

module.exports = {
  app,
  loadLearners,
  analysisRegistry
};
