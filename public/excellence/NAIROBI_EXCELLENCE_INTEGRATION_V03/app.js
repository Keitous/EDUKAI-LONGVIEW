"use strict";

(() => {
  const translations = {
    fr: {
      headerDescription: "Analyse des apprentissages • Recommandations intelligentes • Décision humaine",
      teacherLabel: "Enseignant",
      teacherDemo: "Démonstration",
      navHome: "Nouvelle analyse",
      navDashboard: "Tableau de bord",
      humanValidation: "Validation humaine obligatoire",
      synthetic: "Données synthétiques",
      preview: "Prévisualisation graphique",
      subtitle: "Intelligence pédagogique longitudinale",
      demo: "Mode démonstration",
      welcomeLabel: "LONGVIEW AGENT",
      navLearners: "Apprenants",
      navTrends: "Analyses & Tendances",
      navRecommendations: "Recommandations",
      navHistory: "Décisions & Historique",
      navReports: "Rapports",
      navAdmin: "Session et environnement",
      resetAnalysis: "Réinitialiser",
      welcomeTitle: "Bienvenue sur EDUKAI AFRICA",
      welcomeText: "Analyse les apprentissages, identifie les besoins et propose des recommandations pédagogiques personnalisées.",
      analysisLabel: "ANALYSE LONGITUDINALE",
      analysisTitle: "Analyse longitudinale",
      selectLearner: "Sélectionner un apprenant",
      chooseLearner: "Choisir un dossier de démonstration",
      questionLabel: "Question à LongView",
      questionPlaceholder: "Quelle est l'évolution pédagogique de cet apprenant ?",
      runAnalysis: "Lancer l'analyse",
      inactiveNote: "",
      howTitle: "Comment ça marche ?",
      step1: "Sélectionner un apprenant",
      step2: "Formuler une question pédagogique",
      step3: "Examiner les résultats avec l'enseignant",
      dashboardLabel: "SUIVI PÉDAGOGIQUE",
      dashboardTitle: "Tableau de bord analytique",
      dashboardDescription: "Suivi des apprentissages et aide à la décision humaine.",
      kpi1Label: "Suivi",
      kpi1Value: "Longitudinal",
      kpi1Text: "Plusieurs années scolaires",
      kpi2Label: "Recommandations",
      kpi2Value: "Traçables",
      kpi2Text: "Justifications pédagogiques",
      kpi3Label: "Décisions",
      kpi3Value: "Humaines",
      kpi3Text: "Validation de l'enseignant",
      chartTitle: "Progression des apprenants",
      illustration: "Illustration graphique — données non connectées.",
      recommendationTitle: "Recommandations pédagogiques",
      humanReviewText: "Toute recommandation doit être examinée par un enseignant.",
      approve: "Approuver",
      modify: "Modifier",
      reject: "Rejeter",
      noDecision: "Illustration uniquement — aucune décision enregistrée."
    },

    en: {
      headerDescription: "Learning analysis • Intelligent recommendations • Human decision-making",
      teacherLabel: "Teacher",
      teacherDemo: "Demonstration",
      navHome: "New analysis",
      navDashboard: "Dashboard",
      humanValidation: "Human validation required",
      synthetic: "Synthetic data",
      preview: "Visual preview",
      subtitle: "Longitudinal educational intelligence",
      demo: "Demonstration mode",
      welcomeLabel: "LONGVIEW AGENT",
      navLearners: "Learners",
      navTrends: "Analysis & Trends",
      navRecommendations: "Recommendations",
      navHistory: "Decisions & History",
      navReports: "Reports",
      navAdmin: "Session & Environment",
      resetAnalysis: "Reset",
      welcomeTitle: "Welcome to EDUKAI AFRICA",
      welcomeText: "Analyze learning progress, identify needs, and propose personalized educational recommendations.",
      analysisLabel: "LONGITUDINAL ANALYSIS",
      analysisTitle: "Longitudinal analysis",
      selectLearner: "Select a learner",
      chooseLearner: "Choose a demonstration record",
      questionLabel: "Ask LongView",
      questionPlaceholder: "How has this learner progressed over time?",
      runAnalysis: "Run analysis",
      inactiveNote: "",
      howTitle: "How does it work?",
      step1: "Select a learner",
      step2: "Ask an educational question",
      step3: "Review results with the teacher",
      dashboardLabel: "EDUCATIONAL MONITORING",
      dashboardTitle: "Analytics dashboard",
      dashboardDescription: "Learning progress monitoring and human decision support.",
      kpi1Label: "Monitoring",
      kpi1Value: "Longitudinal",
      kpi1Text: "Multiple school years",
      kpi2Label: "Recommendations",
      kpi2Value: "Traceable",
      kpi2Text: "Educational explanations",
      kpi3Label: "Decisions",
      kpi3Value: "Human-led",
      kpi3Text: "Teacher validation",
      chartTitle: "Learner progress",
      illustration: "Illustrative chart — no connected data.",
      recommendationTitle: "Educational recommendations",
      humanReviewText: "Every recommendation must be reviewed by a teacher.",
      approve: "Approve",
      modify: "Modify",
      reject: "Reject",
      noDecision: "Illustration only — no decision has been recorded."
    }
  };

  const languageSelect = document.getElementById("language-select");
  const home = document.getElementById("home-view");
  const dashboard = document.getElementById("dashboard-view");

  function applyLanguage(language) {
    const dictionary = translations[language] || translations.fr;

    document.documentElement.lang = language;

    document.querySelectorAll("[data-i18n]").forEach(element => {
      const key = element.dataset.i18n;
      if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
        element.textContent = dictionary[key];
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
      const key = element.dataset.i18nPlaceholder;
      if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
        element.placeholder = dictionary[key];
      }
    });
  }

  function showView(view) {
    const isDashboard = view === "dashboard" || view === "reports";

    home.hidden = isDashboard;
    dashboard.hidden = !isDashboard;

    document.querySelectorAll("[data-view]").forEach(button => {
      const active = button.dataset.view === view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
  }

  function drawDemoChart() {
    const container = document.getElementById("demo-chart");
    if (!container) return;

    container.innerHTML = `
      <svg viewBox="0 0 600 270"
           role="img"
           aria-label="Illustrative longitudinal progress chart">
        <g stroke="#dce6ef" stroke-width="1">
          <line x1="55" y1="40" x2="570" y2="40"/>
          <line x1="55" y1="100" x2="570" y2="100"/>
          <line x1="55" y1="160" x2="570" y2="160"/>
          <line x1="55" y1="220" x2="570" y2="220"/>
        </g>
        <polyline points="80,190 300,135 540,70"
                  fill="none" stroke="#0d9488"
                  stroke-width="5" stroke-linecap="round"/>
        <polyline points="80,165 300,145 540,120"
                  fill="none" stroke="#2563eb"
                  stroke-width="4" stroke-linecap="round"/>
        <g fill="#0d9488">
          <circle cx="80" cy="190" r="6"/>
          <circle cx="300" cy="135" r="6"/>
          <circle cx="540" cy="70" r="6"/>
        </g>
        <g fill="#2563eb">
          <circle cx="80" cy="165" r="5"/>
          <circle cx="300" cy="145" r="5"/>
          <circle cx="540" cy="120" r="5"/>
        </g>
        <g fill="#62778e" font-size="15" text-anchor="middle">
          <text x="80" y="255">2023–2024</text>
          <text x="300" y="255">2024–2025</text>
          <text x="540" y="255">2025–2026</text>
        </g>
      </svg>
    `;
  }

  document.querySelectorAll("[data-view]").forEach(button => {
    button.addEventListener("click", () => {
      showView(button.dataset.view);
    });
  });

  languageSelect.addEventListener("change", () => {
    const lang = languageSelect.value === "en" ? "en" : "fr";
    sessionStorage.setItem("edukai-nairobi-language", lang);
    applyLanguage(lang);
  });

  drawDemoChart();
  const savedLanguage = sessionStorage.getItem("edukai-nairobi-language");
  const initialLanguage = savedLanguage === "en" ? "en" : "fr";
  languageSelect.value = initialLanguage;
  applyLanguage(initialLanguage);
  languageSelect.dispatchEvent(new Event("change", { bubbles: true }));
  showView("home");
})();


/* J02.05.99 - Réinitialisation locale du formulaire */
document.getElementById("reset-analysis")?.addEventListener(
  "click",
  () => {
    const learner = document.getElementById("learner-select");
    const question = document.getElementById("longview-question");
    if (learner) learner.value = "";
    if (question) question.value = "";
  }
);


/* J02.06.04 - QUESTION BILINGUE */

(() => {
  "use strict";

  const language = document.getElementById("language-select");
  const question = document.getElementById("longview-question");
  const reset = document.getElementById("reset-analysis");

  if (!language || !question) return;

  const suggestedQuestions = {
    fr: "Analyse l'évolution scolaire de Ibrahima Keita sur les trois années disponibles. Identifie ses principales forces, ses difficultés éventuelles et propose des recommandations pédagogiques adaptées.",

    en: "Analyze Ibrahima Keita's academic progress over the three available school years. Identify his main strengths, potential learning difficulties, and propose appropriate personalized educational recommendations."
  };

  let automaticQuestion =
    question.value === suggestedQuestions.fr ||
    question.value === suggestedQuestions.en;

  function updateSuggestedQuestion() {
    if (!automaticQuestion) return;

    const lang = language.value === "en" ? "en" : "fr";
    question.value = suggestedQuestions[lang];
  }

  question.addEventListener("input", () => {
    automaticQuestion = false;
  });

  language.addEventListener("change", updateSuggestedQuestion);

  if (reset) {
    reset.addEventListener("click", () => {
      automaticQuestion = false;
    });
  }

  updateSuggestedQuestion();
})();


/* J02.06.10 - ENTETE NAIROBI */

(() => {
  "use strict";

  const select = document.getElementById("language-select");
  const fr = document.getElementById("nairobi-fr");
  const en = document.getElementById("nairobi-en");

  if (!select || !fr || !en) return;

  function refreshButtons() {
    const isFrench = select.value !== "en";

    fr.classList.toggle("active", isFrench);
    en.classList.toggle("active", !isFrench);

    fr.setAttribute("aria-pressed", String(isFrench));
    en.setAttribute("aria-pressed", String(!isFrench));
  }

  function switchLanguage(lang) {
    if (select.value !== lang) {
      select.value = lang;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }

    refreshButtons();
  }

  fr.addEventListener("click", () => switchLanguage("fr"));
  en.addEventListener("click", () => switchLanguage("en"));

  select.addEventListener("change", refreshButtons);

  refreshButtons();
})();


/* J02.06.15 - PREFIXE BILINGUE BANNIERE */
(() => {
  "use strict";

  const language = document.getElementById("language-select");
  const prefix = document.getElementById("nairobi-welcome-prefix");

  if (!language || !prefix) return;

  function translateBannerPrefix() {
    prefix.textContent =
      language.value === "en" ? "Welcome to" : "Bienvenue sur";
  }

  language.addEventListener("change", translateBannerPrefix);
  translateBannerPrefix();
})();

/* J02.06.29.05.02 NAIROBI DASHBOARD */
(() => {
  "use strict";

  const years = ["2023–24","2024–25","2025–26"];
  const series = [
    {color:"#2563eb",values:[58,71,83]},
    {color:"#10a997",values:[64,69,76]},
    {color:"#9864d7",values:[72,74,75]},
    {color:"#e6a13b",values:[88,91,93]}
  ];

  function chart() {
    const target = document.getElementById("nd-chart");
    if (!target) return;
    const xs = [65,285,505];
    const y = v => 220 - v * 1.8;
    const grid = [0,25,50,75,100].map(v =>
      `<line x1="48" y1="${y(v)}" x2="530" y2="${y(v)}" stroke="#e5edf6"/>
       <text x="39" y="${y(v)+4}" text-anchor="end" fill="#8493a7" font-size="11">${v}</text>`
    ).join("");
    const curves = series.map(s => {
      const points = s.values.map((v,i) => `${xs[i]},${y(v)}`).join(" ");
      const dots = s.values.map((v,i) =>
        `<circle cx="${xs[i]}" cy="${y(v)}" r="4" fill="${s.color}" stroke="white" stroke-width="2"><title>${v}</title></circle>`
      ).join("");
      return `<polyline points="${points}" fill="none" stroke="${s.color}" stroke-width="3" stroke-linejoin="round"/>${dots}`;
    }).join("");
    const labels = years.map((year,i) =>
      `<text x="${xs[i]}" y="245" text-anchor="middle" fill="#687f99" font-size="12">${year}</text>`
    ).join("");
    target.innerHTML = `<svg viewBox="0 0 560 260" role="img" aria-label="Synthetic longitudinal results">${grid}${curves}${labels}</svg>`;
  }

  function translate() {
    const lang = document.getElementById("language-select")?.value === "en" ? "en" : "fr";
    document.querySelectorAll("#dashboard-view [data-nd-fr]").forEach(el => {
      el.textContent = lang === "en" ? el.dataset.ndEn : el.dataset.ndFr;
    });
  }

  function activateTab(tab) {
    document.querySelectorAll("#dashboard-view [data-nd-tab]").forEach(button => {
      const active = button.dataset.ndTab === tab;
      button.classList.toggle("active",active);
      button.setAttribute("aria-selected",String(active));
    });
    document.querySelectorAll("#dashboard-view [data-nd-panel]").forEach(panel => {
      panel.hidden = panel.dataset.ndPanel !== tab;
    });
  }

  document.querySelectorAll("#dashboard-view [data-nd-tab]").forEach(button => {
    button.addEventListener("click", () => activateTab(button.dataset.ndTab));
  });

  document.getElementById("language-select")?.addEventListener("change",translate);

  // Graphique dynamique gere par nairobi-v03-chart.js
  translate();
  activateTab("analysis");
})();

/* J02.06.29.07 NAIROBI FINITIONS */
(() => {
  "use strict";

  function updateAverageFormat() {
    const element = document.getElementById("nd-average-progress");
    const selector = document.getElementById("language-select");

    if (!element) return;

    element.textContent =
      selector && selector.value === "en" ? "+13.3" : "+13,3";
  }

  document.getElementById("language-select")
    ?.addEventListener("change",updateAverageFormat);

  // Progression moyenne geree par nairobi-v03-kpi.js
})();

/* J02.06.29.11 COUNTRY LANGUAGE */
(() => {
    "use strict";

    const selector = document.getElementById("language-select");

    function updateCountryLanguage() {
        const country = document.querySelector(
            "#dashboard-view .nd-country [data-nairobi-fr][data-nairobi-en]"
        );

        if (!country) return;

        const language = selector && selector.value === "en" ? "en" : "fr";

        country.textContent = country.getAttribute(
            "data-nairobi-" + language
        );
    }

    if (selector) {
        selector.addEventListener("change", updateCountryLanguage);
    }

    updateCountryLanguage();
})();