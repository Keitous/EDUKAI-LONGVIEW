"use strict";

(() => {
  const dashboard = document.getElementById("dashboard-view");
  const language = document.getElementById("language-select");
  const target = document.getElementById("nd-chart");

  if (!dashboard || !target) return;

  const SVG_NS = "http://www.w3.org/2000/svg";

  const subjects = [
    { key: "mathematics", color: "#2563eb" },
    { key: "science", color: "#10a997" },
    { key: "language", color: "#9864d7" },
    { key: "attendance", color: "#e6a13b" }
  ];

  let current = null;

  function english() {
    return language?.value === "en";
  }

  function valid(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function svgElement(name, attributes = {}, text) {
    const el = document.createElementNS(SVG_NS, name);

    Object.entries(attributes).forEach(([key, value]) => {
      el.setAttribute(key, String(value));
    });

    if (text !== undefined) el.textContent = String(text);
    return el;
  }

  function draw(analysis) {
    const records = Array.isArray(analysis.yearlyRecords)
      ? analysis.yearlyRecords
      : [];

    if (!records.length) {
      target.textContent = english()
        ? "No longitudinal data available."
        : "Aucune donnée longitudinale disponible.";
      return;
    }

    const width = 560;
    const height = 270;
    const left = 48;
    const right = 530;
    const top = 20;
    const bottom = 220;

    const x = index => records.length === 1
      ? (left + right) / 2
      : left + (right - left) * index / (records.length - 1);

    const y = value => bottom - (value / 100) * (bottom - top);

    const svg = svgElement("svg", {
      viewBox: `0 0 ${width} ${height}`,
      role: "img",
      "aria-label": english()
        ? "Longitudinal learner results, synthetic data"
        : "Résultats longitudinaux de l'apprenant, données synthétiques"
    });

    [0, 25, 50, 75, 100].forEach(value => {
      svg.appendChild(svgElement("line", {
        x1: left, y1: y(value),
        x2: right, y2: y(value),
        stroke: "#e5edf6"
      }));

      svg.appendChild(svgElement("text", {
        x: 39, y: y(value) + 4,
        "text-anchor": "end",
        fill: "#8493a7",
        "font-size": 11
      }, value));
    });

    subjects.forEach(subject => {
      const values = records.map(record => record[subject.key]);

      let segment = [];

      function flushSegment() {
        if (segment.length >= 2) {
          svg.appendChild(svgElement("polyline", {
            points: segment.map(point => point.join(",")).join(" "),
            fill: "none",
            stroke: subject.color,
            "stroke-width": 3,
            "stroke-linejoin": "round",
            "stroke-linecap": "round"
          }));
        }
        segment = [];
      }

      values.forEach((value, index) => {
        if (!valid(value)) {
          flushSegment();
          return;
        }

        const point = [x(index), y(value)];
        segment.push(point);

        const circle = svgElement("circle", {
          cx: point[0],
          cy: point[1],
          r: 4,
          fill: subject.color,
          stroke: "white",
          "stroke-width": 2
        });

        circle.appendChild(svgElement("title", {},
          `${subject.key} — ${records[index].year}: ${value}`
        ));

        svg.appendChild(circle);
      });

      flushSegment();
    });

    records.forEach((record, index) => {
      svg.appendChild(svgElement("text", {
        x: x(index),
        y: 250,
        "text-anchor": "middle",
        fill: "#687f99",
        "font-size": 12
      }, record.year || "—"));
    });

    target.replaceChildren(svg);

    const chartCard = target.closest(".nd-card");
    if (chartCard) {
      chartCard.hidden = false;

      const note = chartCard.querySelector(".nd-muted");
      if (note) {
        note.dataset.ndFr = "Données synthétiques • Résultats issus de l'API V0.3";
        note.dataset.ndEn = "Synthetic data • Results from V0.3 API";
        note.textContent = english() ? note.dataset.ndEn : note.dataset.ndFr;
      }
    }
  }

  function render(analysis) {
    current = analysis;
    draw(analysis);
  }

  language?.addEventListener("change", () => {
    if (current) queueMicrotask(() => draw(current));
  });

  function clear() {
    current = null;
    target.replaceChildren();
  }

  window.NairobiV03Chart = Object.freeze({ render, clear });
})();