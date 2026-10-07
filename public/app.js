function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function convertMarkdownTables(text) {
  const lines =
    text.split("\n");

  const output = [];

  let index = 0;

  while (index < lines.length) {
    const currentLine =
      lines[index];

    const nextLine =
      lines[index + 1] || "";

    const isTableHeader =
      currentLine.trim().startsWith("|") &&
      nextLine.trim().startsWith("|") &&
      /^[\s|:-]+$/.test(
        nextLine.trim()
      );

    if (!isTableHeader) {
      output.push(currentLine);
      index += 1;
      continue;
    }

    const headerCells =
      currentLine
        .split("|")
        .slice(1, -1)
        .map(
          (cell) => cell.trim()
        );

    index += 2;

    const rows = [];

    while (
      index < lines.length &&
      lines[index]
        .trim()
        .startsWith("|")
    ) {
      const cells =
        lines[index]
          .split("|")
          .slice(1, -1)
          .map(
            (cell) => cell.trim()
          );

      rows.push(cells);
      index += 1;
    }

    let table =
      '<div class="table-wrapper">' +
      "<table>" +
      "<thead><tr>";

    for (const cell of headerCells) {
      table +=
        `<th>${cell}</th>`;
    }

    table +=
      "</tr></thead><tbody>";

    for (const row of rows) {
      table += "<tr>";

      for (const cell of row) {
        table +=
          `<td>${cell}</td>`;
      }

      table += "</tr>";
    }

    table +=
      "</tbody></table></div>";

    output.push(table);
  }

  return output.join("\n");
}
function renderLongViewMarkdown(markdown) {
  let safeText =
    escapeHtml(markdown);
safeText =
  convertMarkdownTables(
    safeText
  );
  // Gras Markdown
  safeText =
    safeText.replace(
      /\*\*(.+?)\*\*/g,
      "<strong>$1</strong>"
    );

  // Titres Markdown
  safeText =
    safeText.replace(
      /^### (.+)$/gm,
      "<h4>$1</h4>"
    );

  safeText =
    safeText.replace(
      /^## (.+)$/gm,
      "<h3>$1</h3>"
    );

  safeText =
    safeText.replace(
      /^# (.+)$/gm,
      "<h2>$1</h2>"
    );

  // Listes simples
  safeText =
    safeText.replace(
      /^[-*] (.+)$/gm,
      "<li>$1</li>"
    );

  // Regrouper les éléments de liste consécutifs
  safeText =
    safeText.replace(
      /(?:<li>.*?<\/li>\n?)+/gs,
      (list) =>
        `<ul>${list}</ul>`
    );

  // Paragraphes / retours à la ligne
  safeText =
    safeText.replace(
      /\n{2,}/g,
      "</p><p>"
    );

  safeText =
    safeText.replace(
      /\n/g,
      "<br>"
    );

  return `<div class="longview-response"><p>${safeText}</p></div>`;
}
const learnerSelect =
  document.getElementById("learnerSelect");

async function loadLearners() {
  try {
    learnerSelect.disabled = true;

    const response =
      await fetch("/api/learners");

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    if (
      !data.success ||
      !Array.isArray(data.learners)
    ) {
      throw new Error(
        "Invalid learner response."
      );
    }

    for (const learner of data.learners) {
      const option =
        document.createElement("option");

      option.value = learner.id;

      option.textContent =
        `${learner.id} - ${learner.name}`;

      learnerSelect.appendChild(
        option
      );
    }

    learnerSelect.disabled = false;
  } catch (error) {
    console.error(
      "Unable to load learners:",
      error
    );

    learnerSelect.innerHTML =
      '<option value="">Erreur de chargement des apprenants</option>';

    learnerSelect.disabled = true;
  }
}

loadLearners();
const questionInput =
  document.getElementById("question");

const analyzeButton =
  document.getElementById("analyzeButton");

const result =
  document.getElementById("result");
const teacherComment =
  document.getElementById("teacherComment");

const approveButton =
  document.getElementById("approveButton");

const modifyButton =
  document.getElementById("modifyButton");

const rejectButton =
  document.getElementById("rejectButton");

const languageButton =
  document.getElementById("languageButton");

const headerDescription =
  document.getElementById("headerDescription");
const analysisTitle =
  document.getElementById("analysisTitle");
const learnerLabel =
  document.getElementById("learnerLabel");
const questionLabel =
  document.getElementById("questionLabel");
const resultTitle =
  document.getElementById("resultTitle");
const reviewTitle =
  document.getElementById("reviewTitle");
const reviewDescription =
  document.getElementById("reviewDescription");

let currentLanguage = "fr";

const uiTranslations = {
  fr: {
    switchLanguage: "English",
    headerDescription:
      "Intelligence longitudinale pour accompagner les enseignants dans le suivi des apprenants.",
    analysisTitle: "Analyse longitudinale",
    learnerLabel: "Apprenant",
    selectLearner: "Sélectionner un apprenant",
    questionLabel: "Question à LongView",
    questionPlaceholder:
      "Ex. Analyse l'évolution de cet apprenant et identifie ses principales forces.",
    analyzeButton: "Analyser avec LongView",
    analyzingButton: "Analyse en cours...",
    analyzingMessage:
      "LongView analyse les données longitudinales...",
    selectLearnerError:
      "Veuillez sélectionner un apprenant.",
    questionRequiredError:
      "Veuillez saisir une question pour LongView.",
    analysisFailed:
      "LongView n'a pas pu terminer l'analyse. Veuillez réessayer.",
    resultTitle: "Résultat de l'analyse",
    emptyResult: "Aucune analyse effectuée.",
    reviewTitle: "Décision de l'enseignant",
    reviewDescription:
      "LongView fournit une aide à la décision. La décision finale appartient à l'enseignant.",
    commentPlaceholder:
      "Commentaire de l'enseignant...",
    approve: "Approuver",
    modify: "Modifier",
    reject: "Rejeter",
    reviewNoLearner:
      "Veuillez sélectionner un apprenant.",
    reviewNoAnalysis:
      "Veuillez d'abord effectuer une analyse LongView.",
    reviewNoAnalysisId:
      "La référence de l'analyse est manquante. Veuillez effectuer une nouvelle analyse.",
    reviewLearnerMismatch:
      "L'apprenant sélectionné ne correspond pas à l'analyse affichée. Veuillez effectuer une nouvelle analyse.",
    reviewModificationComment:
      "Veuillez expliquer la modification dans le commentaire de l'enseignant.",
    approvedLabel:
      "Recommandation approuvée",
    modifiedLabel:
      "Recommandation modifiée",
    rejectedLabel:
      "Recommandation rejetée",
    referenceLabel:
      "Référence",
    reviewSaved:
      "La décision humaine a été enregistrée.",
    reviewFailed:
      "Impossible d'enregistrer la décision de l'enseignant."
  },

  en: {
    switchLanguage: "Français",
    headerDescription:
      "Longitudinal intelligence to support teachers in monitoring learner progress.",
    analysisTitle: "Longitudinal Analysis",
    learnerLabel: "Learner",
    selectLearner: "Select a learner",
    questionLabel: "Question for LongView",
    questionPlaceholder:
      "Example: Analyze this learner's progress and identify their main strengths.",
    analyzeButton: "Analyze with LongView",
    analyzingButton: "Analyzing...",
    analyzingMessage:
      "LongView is analyzing the longitudinal data...",
    selectLearnerError:
      "Please select a learner.",
    questionRequiredError:
      "Please enter a question for LongView.",
    analysisFailed:
      "LongView could not complete the analysis. Please try again.",
    resultTitle: "Analysis Result",
    emptyResult: "No analysis performed yet.",
    reviewTitle: "Teacher Decision",
    reviewDescription:
      "LongView provides decision support. The final decision belongs to the teacher.",
    commentPlaceholder:
      "Teacher comment...",
    approve: "Approve",
    modify: "Modify",
    reject: "Reject",
    reviewNoLearner:
      "Please select a learner.",
    reviewNoAnalysis:
      "Please perform a LongView analysis first.",
    reviewNoAnalysisId:
      "The analysis reference is missing. Please perform a new analysis.",
    reviewLearnerMismatch:
      "The selected learner does not match the displayed analysis. Please perform a new analysis.",
    reviewModificationComment:
      "Please explain the modification in the teacher comment.",
    approvedLabel:
      "Recommendation approved",
    modifiedLabel:
      "Recommendation modified",
    rejectedLabel:
      "Recommendation rejected",
    referenceLabel:
      "Reference",
    reviewSaved:
      "The human decision has been recorded.",
    reviewFailed:
      "Unable to record the teacher's decision."
  }
};

function applyLanguage(language) {
  const t = uiTranslations[language];

  document.documentElement.lang = language;

  languageButton.textContent =
    t.switchLanguage;

  headerDescription.textContent =
    t.headerDescription;

  analysisTitle.textContent =
    t.analysisTitle;

  learnerLabel.textContent =
    t.learnerLabel;

  questionLabel.textContent =
    t.questionLabel;

  questionInput.placeholder =
    t.questionPlaceholder;

  analyzeButton.textContent =
    t.analyzeButton;

  resultTitle.textContent =
    t.resultTitle;

  reviewTitle.textContent =
    t.reviewTitle;

  reviewDescription.textContent =
    t.reviewDescription;

  teacherComment.placeholder =
    t.commentPlaceholder;

  approveButton.textContent =
    t.approve;

  modifyButton.textContent =
    t.modify;

  rejectButton.textContent =
    t.reject;

  const emptyOption =
    learnerSelect.querySelector('option[value=""]');

  if (emptyOption) {
    emptyOption.textContent =
      t.selectLearner;
  }

  if (!currentAnalysis) {
    result.textContent =
      t.emptyResult;
  }
}

languageButton.addEventListener(
  "click",
  () => {
    currentLanguage =
      currentLanguage === "fr"
        ? "en"
        : "fr";

    applyLanguage(
      currentLanguage
    );
  }
);
let currentAnalysis = "";
let currentAnalysisLearnerId = "";
let currentAnalysisId = "";
learnerSelect.addEventListener(
  "change",
  () => {
    currentAnalysis = "";
    currentAnalysisLearnerId = "";
    currentAnalysisId = "";
    result.textContent =
      "Aucune analyse effectuée.";

    teacherComment.value = "";
  }
);
analyzeButton.addEventListener(
  "click",
  async () => {
    const learnerId =
      learnerSelect.value;

    const question =
      questionInput.value.trim();

    if (!learnerId) {
      result.textContent =
        uiTranslations[currentLanguage].selectLearnerError;
      return;
    }

    if (!question) {
      result.textContent =
        uiTranslations[currentLanguage].questionRequiredError;
      return;
    }

    analyzeButton.disabled = true;
learnerSelect.disabled = true;

analyzeButton.textContent =
  uiTranslations[currentLanguage].analyzingButton;

    result.textContent =
      uiTranslations[currentLanguage].analyzingMessage;

    try {
      const response =
        await fetch(
          "/api/analyze",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              learnerId,
              question,
              language: currentLanguage
            })
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
          "Analysis failed."
        );
      }

      result.innerHTML =
  renderLongViewMarkdown(
    data.analysis
  );
	        currentAnalysis =
        data.analysis;

      currentAnalysisLearnerId =
        data.learner.id;

	  currentAnalysisId =
        data.analysisId;
    } catch (error) {
      console.error(
        "LongView analysis failed:",
        error
      );

      result.textContent =
        uiTranslations[currentLanguage].analysisFailed;
    } finally {
  analyzeButton.disabled = false;
  learnerSelect.disabled = false;

  analyzeButton.textContent =
    uiTranslations[currentLanguage].analyzeButton;
}
  }
);
async function submitReview(decision) {
  const learnerId =
    learnerSelect.value;

  const comment =
    teacherComment.value.trim();

  if (!learnerId) {
    alert(
      uiTranslations[currentLanguage].reviewNoLearner
    );
    return;
  }
  if (!currentAnalysis) {
    alert(
      uiTranslations[currentLanguage].reviewNoAnalysis
    );
    return;
  }
    if (!currentAnalysisId) {
    alert(
      uiTranslations[currentLanguage].reviewNoAnalysisId
    );
    return;
  }
  if (
    learnerId !==
    currentAnalysisLearnerId
  ) {
    alert(
      uiTranslations[currentLanguage].reviewLearnerMismatch
    );
    return;
  }
  if (
    decision === "modified" &&
    !comment
  ) {
    alert(
      uiTranslations[currentLanguage].reviewModificationComment
    );
    return;
  }

  try {
    const response =
      await fetch(
        "/api/review",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            learnerId,
			 analysisId:
              currentAnalysisId,
            recommendation:
              currentAnalysis,
            decision,
            teacherComment:
              comment
          })
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.error ||
        "Teacher review failed."
      );
    }

    const t =
      uiTranslations[currentLanguage];

    const labels = {
      approved:
        t.approvedLabel,
      modified:
        t.modifiedLabel,
      rejected:
        t.rejectedLabel
    };

    alert(
      `${labels[decision]}.\n\n` +
      `${t.referenceLabel} : ${data.review.reviewId}\n` +
      t.reviewSaved
    );
  } catch (error) {
    console.error(
      "Teacher review failed:",
      error
    );

    alert(
      uiTranslations[currentLanguage].reviewFailed
    );
  }
}

approveButton.addEventListener(
  "click",
  () => submitReview("approved")
);

modifyButton.addEventListener(
  "click",
  () => submitReview("modified")
);

rejectButton.addEventListener(
  "click",
  () => submitReview("rejected")
);
