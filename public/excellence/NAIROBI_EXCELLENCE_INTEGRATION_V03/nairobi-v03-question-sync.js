"use strict";

(() => {
  const learnerSelect = document.getElementById("learner-select");
  const languageSelect = document.getElementById("language-select");
  const question = document.getElementById("longview-question");
  const reset = document.getElementById("reset-analysis");

  if (!learnerSelect || !languageSelect || !question) return;

  const originalQuestions = [
    "Analyse l'évolution scolaire de Ibrahima Keita sur les trois années disponibles. Identifie ses principales forces, ses difficultés éventuelles et propose des recommandations pédagogiques adaptées.",
    "Analyze Ibrahima Keita's academic progress over the three available school years. Identify his main strengths, potential learning difficulties, and propose appropriate personalized educational recommendations."
  ];

  let lastAutomaticQuestion = null;
  let customized = !originalQuestions.includes(question.value) &&
                   question.value.trim() !== "";

  function selectedLearnerName() {
    const option = learnerSelect.selectedOptions[0];

    if (!option || !learnerSelect.value) return "";

    const label = option.textContent.trim();
    const separator = label.indexOf("—");

    return separator >= 0
      ? label.slice(separator + 1).trim()
      : label;
  }

  function buildQuestion(name, language) {
    if (language === "en") {
      return `Analyze the academic progress of ${name} over the three available school years. Identify the learner's main strengths, potential learning difficulties, and propose appropriate personalized educational recommendations.`;
    }

    return `Analyse l'évolution scolaire de ${name} sur les trois années disponibles. Identifie ses principales forces, ses difficultés éventuelles et propose des recommandations pédagogiques adaptées.`;
  }

  function synchronize() {
    if (customized) return;

    const name = selectedLearnerName();

    if (!name) {
      question.value = "";
      lastAutomaticQuestion = "";
      return;
    }

    const language = languageSelect.value === "en" ? "en" : "fr";
    const nextQuestion = buildQuestion(name, language);

    question.value = nextQuestion;
    lastAutomaticQuestion = nextQuestion;
  }

  question.addEventListener("input", () => {
    customized = true;
  });

  learnerSelect.addEventListener("change", () => {
    queueMicrotask(synchronize);
  });

  languageSelect.addEventListener("change", () => {
    queueMicrotask(() => {
      if (customized && lastAutomaticQuestion !== null) {
        question.value = question.value;
      } else {
        synchronize();
      }
    });
  });

  if (reset) {
    reset.addEventListener("click", () => {
      customized = false;
      lastAutomaticQuestion = "";
    });
  }

  queueMicrotask(synchronize);
})();