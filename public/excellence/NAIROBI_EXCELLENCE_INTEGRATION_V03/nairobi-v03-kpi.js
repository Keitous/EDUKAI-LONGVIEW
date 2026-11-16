"use strict";

(() => {
  const dashboard = document.getElementById("dashboard-view");
  const language = document.getElementById("language-select");

  if (!dashboard) return;

  const keys = ["mathematics", "science", "language", "attendance"];

  const labels = {
    mathematics: ["Mathématiques", "Mathematics"],
    science: ["Sciences", "Science"],
    language: ["Langues", "Languages"],
    attendance: ["Assiduité", "Attendance"]
  };

  let current = null;

  function english() {
    return language?.value === "en";
  }

  function valid(v) {
    return typeof v === "number" && Number.isFinite(v);
  }

  function format(v, decimals = 0) {
    if (!valid(v)) return "—";
    return v.toLocaleString(
      english() ? "en-US" : "fr-FR",
      { maximumFractionDigits: decimals }
    );
  }

  function signed(v, decimals = 0) {
    if (!valid(v)) return "—";
    return (v > 0 ? "+" : "") + format(v, decimals);
  }

  function setTranslated(el, fr, en) {
    if (!el) return;
    el.dataset.ndFr = fr;
    el.dataset.ndEn = en;
    el.textContent = english() ? en : fr;
  }

  function setValue(el, value) {
    if (!el) return;
    el.replaceChildren(document.createTextNode(value));
  }

  function average(record) {
    if (!record) return null;

    const values = ["mathematics", "science", "language"]
      .map(key => record[key]);

    if (!values.every(valid)) return null;

    return values.reduce((a, b) => a + b, 0) / 3;
  }

  function renderKpis(a) {
    const cards = [...dashboard.querySelectorAll(".nd-kpi")];
    if (cards.length !== 4) return;

    const records = Array.isArray(a.yearlyRecords)
      ? a.yearlyRecords
      : [];

    const first = records[0];
    const last = records[records.length - 1];

    const subjects = Array.isArray(a.subjects) ? a.subjects : [];

    const comparable = subjects.filter(s =>
      s.subject !== "attendance" &&
      valid(s.initial) &&
      valid(s.final) &&
      valid(s.change)
    );

    const strongest = comparable.length
      ? comparable.reduce((best, s) =>
          s.change > best.change ? s : best
        )
      : null;

    const firstAverage = average(first);
    const lastAverage = average(last);

    const difference =
      valid(firstAverage) && valid(lastAverage)
        ? lastAverage - firstAverage
        : null;

    const math = last && last.mathematics;
    const lastYear = last?.year || "—";

    const strongestValue = cards[0].querySelector("strong");
    const strongestDetail = cards[0].querySelector("p");

    setValue(
      strongestValue,
      strongest ? signed(strongest.change) + " pts" : "—"
    );

    if (strongest) {
      const names = labels[strongest.subject] || [
        strongest.subject, strongest.subject
      ];

      setTranslated(
        strongestDetail,
        `${names[0]} : ${format(strongest.initial)} → ${format(strongest.final)}`,
        `${names[1]}: ${format(strongest.initial)} → ${format(strongest.final)}`
      );
    } else {
      setTranslated(
        strongestDetail,
        "Progression non calculable",
        "Improvement unavailable"
      );
    }

    const mathValue = cards[1].querySelector("strong");
    const mathLabel = cards[1].querySelector("small");

    setValue(mathValue, valid(math) ? format(math) + "/100" : "—");

    setTranslated(
      mathLabel,
      `Mathématiques ${lastYear}`,
      `Mathematics ${lastYear}`
    );

    const averageValue = cards[2].querySelector("strong");
    const averageDetail = cards[2].querySelector("p");

    setValue(
      averageValue,
      valid(lastAverage) ? format(lastAverage, 1) + "/100" : "—"
    );

    setTranslated(
      averageDetail,
      valid(lastAverage)
        ? `${lastYear} • moyenne calculée`
        : `${lastYear} • données incomplètes`,
      valid(lastAverage)
        ? `${lastYear} • calculated average`
        : `${lastYear} • incomplete data`
    );

    const progress = document.getElementById("nd-average-progress");
    const progressValue = cards[3].querySelector("strong");

    if (progress) {
      progress.textContent = signed(difference, 1);
    } else {
      setValue(progressValue, signed(difference, 1) + " pts");
    }

    setTranslated(
      cards[3].querySelector("p"),
      valid(difference)
        ? "Comparaison des moyennes complètes"
        : "Comparaison impossible : données incomplètes",
      valid(difference)
        ? "Comparison of complete averages"
        : "Comparison unavailable: incomplete data"
    );
  }

  function renderTable(a) {
    const table = dashboard.querySelector(".nd-table");
    if (!table) return;

    const records = Array.isArray(a.yearlyRecords)
      ? a.yearlyRecords
      : [];

    const headings = table.querySelectorAll("thead th");

    records.slice(0, 3).forEach((record, index) => {
      if (headings[index + 1]) {
        headings[index + 1].textContent = record.year || "—";
      }
    });

    const rows = table.querySelectorAll("tbody tr");

    keys.forEach((key, index) => {
      const row = rows[index];
      if (!row) return;

      const cells = row.querySelectorAll("td");

      records.slice(0, 3).forEach((record, yearIndex) => {
        if (cells[yearIndex + 1]) {
          cells[yearIndex + 1].textContent =
            format(record[key]);
        }
      });
    });
  }

  function renderFindings(a) {
    const panel = dashboard.querySelector(
      '[data-nd-panel="analysis"]'
    );
    if (!panel) return;

    const cards = panel.querySelectorAll(
      ".nd-main-grid > .nd-card"
    );
    const findingsCard = cards[1];
    if (!findingsCard) return;

    const subjects = Array.isArray(a.subjects)
      ? a.subjects
      : [];

    const findings = findingsCard.querySelectorAll(
      ".nd-finding"
    );

    const subjectKeys = [
      "mathematics",
      "science",
      "language",
      "attendance"
    ];

    subjectKeys.forEach((key, index) => {
      const item = findings[index];
      if (!item) return;

      const subject = subjects.find(s => s.subject === key);
      const title = item.querySelector("strong");
      const description = item.querySelector("p");

      const names = labels[key] || [key, key];

      if (
        !subject ||
        !valid(subject.initial) ||
        !valid(subject.final) ||
        !valid(subject.change)
      ) {
        setTranslated(
          title,
          names[0] + " : —",
          names[1] + ": —"
        );
        setTranslated(
          description,
          "Données insuffisantes",
          "Insufficient data"
        );
        return;
      }

      const change = signed(subject.change);
      const initial = format(subject.initial);
      const final = format(subject.final);

      setTranslated(
        title,
        names[0] + " : " + change + " pts",
        names[1] + ": " + change + " pts"
      );

      setTranslated(
        description,
        "Évolution de " + initial + " à " + final,
        "Change from " + initial + " to " + final
      );
    });

    findingsCard.hidden = false;
  }

  function renderSubjects(a) {
    const panel = dashboard.querySelector(
      '[data-nd-panel="subjects"]'
    );
    if (!panel) return;

    const card = panel.querySelector(".nd-card");
    if (!card) return;

    const subjects = Array.isArray(a.subjects)
      ? a.subjects
      : [];

    const items = card.querySelectorAll(".nd-subject");

    ["mathematics", "science", "language"].forEach(
      (key, index) => {
        const item = items[index];
        if (!item) return;

        const subject = subjects.find(s => s.subject === key);
        const value = item.querySelector("strong");
        const bar = item.querySelector("i");

        if (
          !subject ||
          !valid(subject.final) ||
          !valid(subject.change)
        ) {
          setValue(value, "—");
          if (bar) bar.style.width = "0%";
          return;
        }

        setValue(value, signed(subject.change) + " pts");

        if (bar) {
          const percentage = Math.max(
            0,
            Math.min(100, subject.final)
          );
          bar.style.width = percentage + "%";
        }
      }
    );

    card.hidden = false;
  }
  function hideIllustrations() {
    const chartPanel = dashboard.querySelector(
      '[data-nd-panel="analysis"]'
    );

    if (chartPanel) {
      chartPanel.querySelectorAll(".nd-main-grid > .nd-card")
        .forEach(card => {
          card.hidden = true;
        });
    }

    const subjectPanel = dashboard.querySelector(
      '[data-nd-panel="subjects"]'
    );

    if (subjectPanel) {
      const card = subjectPanel.querySelector(".nd-card");
      if (card) card.hidden = true;
    }
  }

  function render(a) {
    current = a;
    renderKpis(a);
    renderTable(a);
    hideIllustrations();
    renderFindings(a);
    renderSubjects(a);
  }

  language?.addEventListener("change", () => {
    if (current) {
      queueMicrotask(() => {
        if (current) render(current);
      });
    }
  });

  function clear() {
    current = null;
  }

  window.NairobiV03KPI = Object.freeze({ render, clear });
})();