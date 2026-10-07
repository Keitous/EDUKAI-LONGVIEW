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

  // Regrouper les Ã©lÃ©ments de liste consÃ©cutifs
  safeText =
    safeText.replace(
      /(?:<li>.*?<\/li>\n?)+/gs,
      (list) =>
        `<ul>${list}</ul>`
    );

  // Paragraphes / retours Ã  la ligne
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
      "Aucune analyse effectuÃ©e.";

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
        "Veuillez sÃ©lectionner un apprenant.";
      return;
    }

    if (!question) {
      result.textContent =
        "Veuillez saisir une question pour LongView.";
      return;
    }

    analyzeButton.disabled = true;
learnerSelect.disabled = true;

analyzeButton.textContent =
  "Analyse en cours...";

    result.textContent =
      "LongView analyse les donnÃ©es longitudinales...";

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
              question
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
        "LongView n'a pas pu terminer l'analyse. Veuillez rÃ©essayer.";
    } finally {
  analyzeButton.disabled = false;
  learnerSelect.disabled = false;

  analyzeButton.textContent =
    "Analyser avec LongView";
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
      "Veuillez sÃ©lectionner un apprenant."
    );
    return;
  }
  if (!currentAnalysis) {
    alert(
      "Veuillez d'abord effectuer une analyse LongView."
    );
    return;
  }
    if (!currentAnalysisId) {
    alert(
      "La rÃ©fÃ©rence de l'analyse est manquante. Veuillez effectuer une nouvelle analyse."
    );
    return;
  }
  if (
    learnerId !==
    currentAnalysisLearnerId
  ) {
    alert(
      "L'apprenant sÃ©lectionnÃ© ne correspond pas Ã  l'analyse affichÃ©e. Veuillez effectuer une nouvelle analyse."
    );
    return;
  }
  if (
    decision === "modified" &&
    !comment
  ) {
    alert(
      "Veuillez expliquer la modification dans le commentaire de l'enseignant."
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

    const labels = {
      approved:
        "Recommandation approuvÃ©e",
      modified:
        "Recommandation modifiÃ©e",
      rejected:
        "Recommandation rejetÃ©e"
    };

    alert(
      `${labels[decision]}.\n\n` +
      `RÃ©fÃ©rence : ${data.review.reviewId}\n` +
      "La dÃ©cision humaine a Ã©tÃ© enregistrÃ©e."
    );
  } catch (error) {
    console.error(
      "Teacher review failed:",
      error
    );

    alert(
      "Impossible d'enregistrer la dÃ©cision de l'enseignant."
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
