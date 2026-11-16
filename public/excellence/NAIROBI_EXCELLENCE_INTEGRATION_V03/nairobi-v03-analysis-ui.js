"use strict";

(() => {
  const select = document.getElementById("learner-select");
  const button = document.querySelector(".analysis-action");
  const language = document.getElementById("language-select");
  const dashboard = document.getElementById("dashboard-view");
  const home = document.getElementById("home-view");
  const api = window.NairobiV03API;

  if (!select || !button || !dashboard || !api) return;

  const profile = dashboard.querySelector(".nd-profile-info");
  const note = document.querySelector(".preview-note");
  const reset = document.getElementById("reset-analysis");

  let requestVersion = 0;
  let busy = false;

  const resultSelectors = [
    ".nd-overview",
    ".nd-tabs",
    ".nd-tab-content",
    ".nd-main-grid.nd-bottom"
  ];

  const emptyState = document.createElement("p");
  emptyState.id = "nd-analysis-empty";
  emptyState.setAttribute("role", "status");

  dashboard.querySelector("header")?.after(emptyState);

  function updateEmptyState() {
    emptyState.textContent = isEnglish()
      ? "No active analysis. Select a learner and run an analysis."
      : "Aucune analyse active. Sélectionnez un apprenant et lancez une analyse.";
  }

  function clearAnalysis() {
    window.NairobiV03Recommendations.clear();
    window.NairobiV03KPI.clear();
    window.NairobiV03Chart.clear();

    dashboard.dataset.analysisReady = "false";

    resultSelectors.forEach(selector => {
      dashboard.querySelectorAll(selector).forEach(element => {
        element.hidden = true;
      });
    });

    emptyState.hidden = false;
    updateEmptyState();
  }

  function showAnalysis() {
    dashboard.dataset.analysisReady = "true";

    resultSelectors.forEach(selector => {
      dashboard.querySelectorAll(selector).forEach(element => {
        if (!element.matches(".nd-tab-content")) {
          element.hidden = false;
        }
      });
    });

    const activeTab = dashboard.querySelector(".nd-tab.active");
    const selectedTab = activeTab?.dataset.ndTab || "analysis";

    dashboard.querySelectorAll("[data-nd-panel]").forEach(panel => {
      panel.hidden = panel.dataset.ndPanel !== selectedTab;
    });

    emptyState.hidden = true;
  }

  function isEnglish() {
    return language && language.value === "en";
  }

  function refreshButton() {
    button.disabled = busy || !select.value;
  }

  function setMessage(fr, en) {
    if (!note) return;

    note.textContent = isEnglish() ? en : fr;
    note.dataset.i18n = "";
  }

  function updateProfile(analysis) {
    if (!profile) return;

    const name = profile.querySelector("strong");
    const id = profile.querySelector(".nd-id-badge");
    const period = profile.querySelector("small");

    if (name) name.textContent = analysis.learnerName;
    if (id) id.textContent = analysis.learnerId;

    if (period) {
      const from = analysis.period.from;
      const to = analysis.period.to;

      period.dataset.ndFr = `Période : ${from} à ${to}`;
      period.dataset.ndEn = `Period: ${from} to ${to}`;
      period.textContent = isEnglish()
        ? period.dataset.ndEn
        : period.dataset.ndFr;
    }

    const portrait = dashboard.querySelector(".nd-avatar-photo img");

    if (portrait) {
      portrait.hidden = analysis.learnerId !== "LRN001";
    }
  }

  async function runAnalysis() {
    const learnerId = select.value;

    if (!learnerId || busy) return;

    const version = ++requestVersion;
    clearAnalysis();
    busy = true;
    window.NairobiV03Recommendations.clear();
    refreshButton();

    setMessage(
      "Chargement de l'analyse...",
      "Loading analysis..."
    );

    try {
      const analysis = await api.getAnalysis(learnerId);

      if (
        version !== requestVersion ||
        select.value !== learnerId
      ) return;

      updateProfile(analysis);
      window.NairobiV03KPI.render(analysis);
      window.NairobiV03Chart.render(analysis);
      showAnalysis();
      window.NairobiV03Recommendations.load(learnerId);

      if (home) home.hidden = true;
      dashboard.hidden = false;

      document.querySelectorAll("[data-view]").forEach(item => {
        item.classList.toggle(
          "active",
          item.dataset.view === "dashboard"
        );
      });

      setMessage(
        "Analyse chargée. Indicateurs détaillés en cours d'intégration.",
        "Analysis loaded. Detailed indicators are being integrated."
      );

      console.info(
        "[Nairobi] Analyse reelle chargee :",
        analysis.learnerId
      );
    } catch (error) {
      if (version !== requestVersion) return;

      setMessage(
        "Impossible de charger l'analyse.",
        "Unable to load the analysis."
      );

      console.error("[Nairobi]", error);
    } finally {
      if (version === requestVersion) {
        busy = false;
        refreshButton();
      }
    }
  }

  select.addEventListener("change", () => {
    clearAnalysis();
    requestVersion++;
    busy = false;
    refreshButton();
  });

  if (reset) {
    reset.addEventListener("click", () => {
      clearAnalysis();
      requestVersion++;
      busy = false;
      queueMicrotask(refreshButton);
    });
  }

  button.addEventListener("click", runAnalysis);

  // TGN-61.20.002 : chargement des donnees existantes
  // lors de l'ouverture directe du tableau de bord.
  const dashboardNav = document.querySelector(
    '[data-view="dashboard"]'
  );

  dashboardNav?.addEventListener("click", () => {
    const learnerId = select.value;

    if (!learnerId || busy) return;

    if (
      dashboard.dataset.analysisReady === "true" &&
      profile?.querySelector(".nd-id-badge")?.textContent === learnerId
    ) {
      return;
    }

    runAnalysis();
  });

  language?.addEventListener("change", () => {
    if (dashboard.dataset.analysisReady === "false") {
      queueMicrotask(updateEmptyState);
    }
  });

  clearAnalysis();
  refreshButton();
})();