"use strict";

(() => {
  const select = document.getElementById("learner-select");
  const question = document.getElementById("longview-question");
  const language = document.getElementById("language-select");
  const button = document.querySelector(".analysis-action");
  const dashboard = document.getElementById("dashboard-view");
  const reset = document.getElementById("reset-analysis");

  if (!select || !question || !button || !dashboard) return;

  const panel = document.createElement("section");
  panel.id = "longview-llm-report";
  panel.hidden = true;
  panel.style.cssText =
    "margin:24px 0;padding:24px;border:1px solid #dbe5e8;" +
    "border-radius:14px;background:#fff;";

  const heading = document.createElement("h2");
  heading.style.marginTop = "0";

  const status = document.createElement("p");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const content = document.createElement("div");
  content.className = "longview-report-content";
  content.style.cssText =
    "overflow-wrap:anywhere;font-family:inherit;" +
    "font-size:15px;line-height:1.7;";

  panel.append(heading, status, content);
    const analysisArea = dashboard.querySelector(
    ".nd-main-grid.nd-bottom"
  );

  if (analysisArea) {
    analysisArea.after(panel);
  } else {
    dashboard.appendChild(panel);
  }

  let generation = 0;
  let controller = null;

  function english() {
    return language?.value === "en";
  }

  function labels() {
    heading.textContent = english()
      ? "LongView AI — Longitudinal analysis report"
      : "LongView IA — Rapport d'analyse longitudinale";
  }

  function cancel() {
    generation++;
    if (controller) controller.abort();
    controller = null;
    panel.hidden = true;
    content.textContent = "";
    status.textContent = "";
  }

  function reportText(value) {
    if (typeof value === "string") return value;
    if (value == null) return "";
    if (typeof value === "object") {
      if (typeof value.report === "string") return value.report;
      if (typeof value.text === "string") return value.text;
      if (typeof value.answer === "string") return value.answer;
      if (typeof value.content === "string") return value.content;
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  function renderMarkdown(markdown) {
    content.replaceChildren();

    const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    let paragraph = [];
    let list = null;

    function appendInline(parent, source) {
      const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
      let position = 0;

      for (const match of source.matchAll(pattern)) {
        const index = match.index;
        if (index > position) {
          parent.append(document.createTextNode(
            source.slice(position, index)
          ));
        }

        const token = match[0];
        const element = document.createElement(
          token.startsWith("**") ? "strong" :
          token.startsWith("`") ? "code" : "em"
        );

        element.textContent = token.slice(
          token.startsWith("**") ? 2 : 1,
          token.startsWith("**") ? -2 : -1
        );

        parent.append(element);
        position = index + token.length;
      }

      if (position < source.length) {
        parent.append(document.createTextNode(source.slice(position)));
      }
    }

    function flushParagraph() {
      if (!paragraph.length) return;

      const p = document.createElement("p");
      p.style.margin = "12px 0";
      appendInline(p, paragraph.join(" "));
      content.append(p);
      paragraph = [];
    }

    function closeList() {
      list = null;
    }

    function tableCells(line) {
      return line.trim().replace(/^\||\|$/g, "")
        .split("|").map(value => value.trim());
    }

    function isSeparator(line) {
      return /^\s*\|?[\s:|-]+\|?\s*$/.test(line) &&
        line.includes("-");
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        closeList();
        continue;
      }

      if (/^---+$/.test(trimmed)) {
        flushParagraph();
        closeList();
        content.append(document.createElement("hr"));
        continue;
      }

      const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        flushParagraph();
        closeList();

        const level = Math.min(heading[1].length + 1, 6);
        const h = document.createElement("h" + level);
        h.style.margin = "20px 0 10px";
        appendInline(h, heading[2]);
        content.append(h);
        continue;
      }

      if (
        trimmed.includes("|") &&
        i + 1 < lines.length &&
        isSeparator(lines[i + 1])
      ) {
        flushParagraph();
        closeList();

        const table = document.createElement("table");
        table.style.cssText =
          "width:100%;border-collapse:collapse;margin:16px 0;";

        const header = document.createElement("tr");
        for (const value of tableCells(trimmed)) {
          const th = document.createElement("th");
          th.style.cssText =
            "padding:10px;border:1px solid #dbe5e8;" +
            "background:#edf5fa;text-align:left;";
          appendInline(th, value);
          header.append(th);
        }

        table.append(header);
        i++;

        while (i + 1 < lines.length &&
               lines[i + 1].trim().includes("|") &&
               !isSeparator(lines[i + 1])) {
          i++;
          const tr = document.createElement("tr");

          for (const value of tableCells(lines[i])) {
            const td = document.createElement("td");
            td.style.cssText =
              "padding:10px;border:1px solid #dbe5e8;";
            appendInline(td, value);
            tr.append(td);
          }

          table.append(tr);
        }

        content.append(table);
        continue;
      }

      const item = trimmed.match(/^[-*]\s+(.+)$/);
      if (item) {
        flushParagraph();

        if (!list) {
          list = document.createElement("ul");
          list.style.paddingLeft = "24px";
          content.append(list);
        }

        const li = document.createElement("li");
        li.style.marginBottom = "8px";
        appendInline(li, item[1]);
        list.append(li);
        continue;
      }

      closeList();
      paragraph.push(trimmed);
    }

    flushParagraph();
  }
  async function generate() {
    const learnerId = select.value;
    const prompt = question.value.trim();
    const lang = english() ? "en" : "fr";

    if (!/^LRN[0-9]{3,10}$/.test(learnerId)) return;

    cancel();
    const current = generation;
    controller = new AbortController();

    labels();
    panel.hidden = false;
    status.textContent = lang === "en"
      ? "Generating the evidence-based report..."
      : "Generation du rapport fonde sur les preuves...";

    if (!prompt || prompt.length > 4000) {
      status.textContent = lang === "en"
        ? "Enter a question (maximum 4000 characters)."
        : "Saisissez une question (4000 caracteres maximum).";
      return;
    }

    try {
      const response = await fetch("/api/v03/longview/analyze", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          learnerId,
          question: prompt,
          language: lang
        }),
        signal: controller.signal
      });

      const result = await response.json().catch(() => ({}));

      if (current !== generation || select.value !== learnerId) return;

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.error || `HTTP ${response.status}`
        );
      }

      const text = reportText(result.analysis);
      if (!text.trim()) throw new Error("Empty LongView report");

      renderMarkdown(text);

      // Save only a successful, non-empty report.
      // Keep learner and language separate.
      try {
        const storageKey =
          "edukai:nairobi:longview:v1:" + learnerId + ":" + lang;

        sessionStorage.setItem(storageKey, JSON.stringify({
          learnerId: learnerId,
          language: lang,
          question: prompt,
          text: text,
          generatedAt: new Date().toISOString()
        }));
      } catch (storageError) {
        console.warn(
          "[Nairobi LongView] Unable to save report in this tab",
          storageError
        );
      }
      status.textContent = lang === "en"
        ? "AI-generated report — teacher review required."
        : "Rapport genere par IA — validation humaine requise.";

    } catch (error) {
      if (current !== generation || error.name === "AbortError") return;

      status.textContent = lang === "en"
        ? "LongView report unavailable: " + error.message
        : "Rapport LongView indisponible : " + error.message;

      console.error("[Nairobi LongView]", error);
    } finally {
      if (current === generation) controller = null;
    }
  }

  button.addEventListener("click", () => {
    generate();
  });

  select.addEventListener("change", cancel);
  reset?.addEventListener("click", cancel);
  language?.addEventListener("change", labels);

  labels();
})();