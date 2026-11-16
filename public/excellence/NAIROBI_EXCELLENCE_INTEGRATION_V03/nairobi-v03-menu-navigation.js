"use strict";

(() => {
  const dashboard = document.getElementById("dashboard-view");
  const home = document.getElementById("home-view");

  if (!dashboard || !home) return;

  const views = {
    learners: "#learner-select",
    trends: "#nd-chart",
    recommendations: "#nd-recommendations-card",
    history: "#nd-review-history-notice",
    reports: "#longview-llm-report",
    admin: "#nairobi-teacher-menu"
  };

  const labels = {
    fr: {
      learners: "Apprenants",
      trends: "Analyses & Tendances",
      recommendations: "Recommandations",
      history: "Decisions & Historique",
      reports: "Rapports",
      admin: "Session et environnement"
    },
    en: {
      learners: "Learners",
      trends: "Analysis & Trends",
      recommendations: "Recommendations",
      history: "Decisions & History",
      reports: "Reports",
      admin: "Session & Environment"
    }
  };

  document.querySelectorAll(".navigation [data-view]").forEach(button => {
    const view = button.dataset.view;

    if (!views[view]) return;

    button.addEventListener("click", () => {
      home.hidden = true;
      dashboard.hidden = false;

      document.querySelectorAll(".navigation [data-view]")
        .forEach(item => {
          const active = item === button;
          item.classList.toggle("active", active);
          item.setAttribute(
            "aria-current",
            active ? "page" : "false"
          );
        });

      const target = document.querySelector(views[view]);

      if (target && !target.hidden) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      } else {
        const lang = document.getElementById("language-select")
          ?.value === "en" ? "en" : "fr";

        console.info(
          "[EDUKAI Nairobi]",
          labels[lang][view],
          "section not yet available"
        );
      }
    });
  });
})();