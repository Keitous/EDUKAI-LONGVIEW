"use strict";
(() => {
  const API = "/api/v03";
  const $ = id => document.getElementById(id);
  const state = { learners: [], selected: null, analysis: null, published: [], history: [] };
  let noticeTimeout;
  function notify(message, error = false) {
    const el = $("notice"); el.textContent = message; el.className = error ? "error" : "";
    clearTimeout(noticeTimeout); noticeTimeout = setTimeout(() => { el.textContent = ""; }, 6500);
  }
  async function request(path, options = {}) {
    const response = await fetch(API + path, { credentials: "same-origin", ...options,
      headers: { ...(options.body ? {"Content-Type":"application/json"} : {}), ...options.headers } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || body.message || `Erreur HTTP ${response.status}`);
    return body;
  }
  const pick = (obj, ...names) => names.map(n => obj?.[n]).find(v => v !== undefined && v !== null);
  const arr = (obj, ...names) => Array.isArray(obj) ? obj : (names.map(n => obj?.[n]).find(Array.isArray) || []);
  const nameOf = obj => pick(obj, "nom_complet", "fullName", "learnerName", "nom", "name", "prenom_nom") || [obj?.prenom, obj?.nom].filter(Boolean).join(" ") || "Apprenant";
  const idOf = obj => String(pick(obj,"id_apprenant","learnerId","id","code_apprenant","identifiant") || "");
  function element(tag, className, text) { const el=document.createElement(tag); if(className) el.className=className; if(text!==undefined) el.textContent=String(text); return el; }
  function showDashboard() { $("login-panel").hidden=true; $("dashboard").hidden=false;  }
  function showLogin() { $("dashboard").hidden=true; $("login-panel").hidden=false;  }
  async function loadLearners() {
    const result=await request("/learners"); state.learners=arr(result,"learners","apprenants","data","results");
    $("count-learners").textContent=state.learners.length;
    const list=$("learners-list"); list.replaceChildren();
    state.learners.forEach(learner => {
      const id=idOf(learner); if(!id) return;
      const b=element("button","learner"+(state.selected===id?" active":"")); b.type="button";
      b.append(element("strong","",nameOf(learner)),element("small","",id));
      b.addEventListener("click",()=>selectLearner(id)); list.append(b);
    });
    if(!state.learners.length) list.append(element("p","muted","Aucun apprenant trouvé dans la réponse de l'API."));
  }
  function numeric(value) { const n=Number(value); return Number.isFinite(n)?n:null; }
  function metricsFromAnalysis(a) {
    const trends=pick(a,"subjects","trends","tendances","indicators","indicateurs") || pick(a?.analysis,"subjects","trends","indicators") || {};
    const items=Array.isArray(trends) ? trends.map((v,i)=>[v.subject||v.name||`Indicateur ${i+1}`,v]) : Object.entries(trends);
    return items.map(([key,v])=>{
      const value=typeof v==="object" && v!==null?v:{};
      const start=numeric(pick(value,"initial","initialValue","first","start","firstValue","valeur_initiale"));
      const end=numeric(pick(value,"final","finalValue","last","end","lastValue","valeur_finale"));
      const delta=numeric(pick(value,"change","delta","variation","progression"));
      return {label:String(key),start,end,delta:delta??(start!==null&&end!==null?end-start:null)};
    }).filter(x=>x.delta!==null || x.start!==null);
  }
  function drawChart(metrics, payload) {
    const container = $("chart");
    container.replaceChildren();

    const analysis = payload?.analysis || payload || {};
    const records = Array.isArray(analysis.yearlyRecords)
      ? [...analysis.yearlyRecords].sort(
          (a, b) => String(a.year).localeCompare(String(b.year))
        )
      : [];

    const series = [
      { key: "mathematics", label: "Mathématiques", color: "#087f8c" },
      { key: "science", label: "Sciences", color: "#d18b28" },
      { key: "language", label: "Langues", color: "#7757bd" },
      { key: "attendance", label: "Assiduité", color: "#238b63" }
    ];

    if (records.length < 2) {
      container.append(element(
        "p", "muted",
        "Données annuelles insuffisantes pour afficher les courbes."
      ));
      return;
    }

    const ns = "http://www.w3.org/2000/svg";
    const width = 850;
    const height = 390;
    const left = 65;
    const right = 35;
    const top = 35;
    const bottom = 95;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("role", "img");
    svg.setAttribute(
      "aria-label",
      "Évolution des résultats scolaires année par année"
    );
    svg.style.width = "100%";
    svg.style.height = "auto";

    const add = (tag, attrs, value) => {
      const node = document.createElementNS(ns, tag);

      Object.entries(attrs).forEach(([key, val]) => {
        node.setAttribute(key, String(val));
      });

      if (value !== undefined) {
        node.textContent = String(value);
      }

      svg.append(node);
      return node;
    };

    const values = records.flatMap(record =>
      series.map(s => {
        const value = record[s.key];
        return value == null || value === ""
          ? null
          : Number(value);
      })
    ).filter(Number.isFinite);

    const maxValue = Math.max(100, ...values);
    const minValue = Math.min(0, ...values);

    const x = index => left +
      index * plotWidth / Math.max(1, records.length - 1);

    const y = value => top + plotHeight -
      ((value - minValue) / (maxValue - minValue)) * plotHeight;

    for (let tick = 0; tick <= 4; tick++) {
      const value = minValue +
        tick * (maxValue - minValue) / 4;

      const yy = y(value);

      add("line", {
        x1: left, y1: yy,
        x2: width - right, y2: yy,
        stroke: "#e2eaf0",
        "stroke-width": 1
      });

      add("text", {
        x: left - 12, y: yy + 4,
        "text-anchor": "end",
        fill: "#64788d",
        "font-size": 12
      }, Number(value.toFixed(1)));
    }

    records.forEach((record, index) => {
      add("text", {
        x: x(index),
        y: top + plotHeight + 28,
        "text-anchor": "middle",
        fill: "#24485c",
        "font-size": 12
      }, record.year);
    });

    series.forEach(s => {
      const points = records.map((record, index) => {
        const raw = record[s.key];
        const value = raw == null || raw === ""
          ? NaN
          : Number(raw);

        return {
          index,
          value,
          valid: Number.isFinite(value)
        };
      });

      let segment = [];

      const flush = () => {
        if (segment.length > 1) {
          add("polyline", {
            points: segment.map(p =>
              `${x(p.index)},${y(p.value)}`
            ).join(" "),
            fill: "none",
            stroke: s.color,
            "stroke-width": 3,
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          });
        }
        segment = [];
      };

      points.forEach(point => {
        if (!point.valid) {
          flush();
          return;
        }

        segment.push(point);
      });

      flush();

      points.filter(p => p.valid).forEach(point => {
        const dot = add("circle", {
          cx: x(point.index),
          cy: y(point.value),
          r: 5,
          fill: s.color,
          stroke: "#ffffff",
          "stroke-width": 2
        });

        const tooltip = document.createElementNS(ns, "title");
        tooltip.textContent =
          `${s.label} - ${records[point.index].year} : ${point.value}`;
        dot.append(tooltip);
      });
    });

    series.forEach((s, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const xx = left + col * 250;
      const yy = height - 48 + row * 20;

      add("line", {
        x1: xx, y1: yy,
        x2: xx + 24, y2: yy,
        stroke: s.color,
        "stroke-width": 4
      });

      add("text", {
        x: xx + 32, y: yy + 4,
        fill: "#24485c",
        "font-size": 12
      }, s.label);
    });

    container.append(svg);
  }
  function drawMetrics(metrics){const target=$("metrics");target.replaceChildren();metrics.forEach(m=>{const box=element("div","metric");box.append(element("span","",m.label),element("strong","",m.delta===null?"—":`${m.delta>0?"+":""}${m.delta}`));target.append(box);});}
  function normalizeRecommendations(payload){return arr(payload,"recommendations","recommandations","data","results");}
  function renderRecommendations(payload) {
  const target = $("recommendations");
  target.replaceChildren();

  const recs = normalizeRecommendations(payload);

  if (!recs.length) {
    target.append(element("p", "muted",
      "Aucune recommandation disponible."));
    return;
  }

  recs.forEach((r, i) => {
    const recId = pick(
      r, "id_recommandation", "recommendationId", "id"
    );

    const historyRow = state.history.find(h =>
      String(pick(
        h, "id_recommandation", "recommendationId", "id"
      )) === String(recId)
    ) || {};

    const card = element("article", "rec");
    const heading = element("div", "rec-head");

    const title = pick(
      r, "subject", "matiere", "domaine", "title", "titre"
    ) || pick(
      historyRow, "subject", "matiere", "domaine"
    ) || `Recommandation ${recId || i + 1}`;

    const priority = pick(
      r, "priority", "priorite"
    ) || pick(historyRow, "priority", "priorite");

    const status = String(
      pick(r, "statut", "status") ||
      pick(historyRow, "statut", "statut_recommandation") ||
      ""
    ).toLowerCase();

    heading.append(
      element("strong", "", String(title)),
      element("small", "",
        [priority, status].filter(Boolean).join(" - ") ||
        "Proposition")
    );

    card.append(heading);

    const content = pick(
      r, "content", "contenu", "recommendation",
      "suggestion", "message", "text", "description"
    ) || pick(
      historyRow, "contenu", "content",
      "recommendation", "description"
    );

    card.append(element(
      "p", "",
      content
        ? String(content)
        : "Contenu non fourni par cette réponse du serveur."
    ));

    const reason = pick(
      r, "justification", "rationale", "reason"
    ) || pick(
      historyRow, "justification", "rationale"
    );

    if (reason) {
      card.append(element("small", "", String(reason)));
    }

    if (recId && [
      "en_attente", "pending", "pending_teacher_review"
    ].includes(status)) {
      const actions = element("div", "rec-actions");

      [
        ["Approuver", "approuvee", "approve"],
        ["Modifier", "modifiee", "modify"],
        ["Rejeter", "rejetee", "reject"]
      ].forEach(([label, decision, cls]) => {
        const btn = element("button", cls, label);
        btn.type = "button";
        btn.addEventListener("click", () =>
          openReview(card, recId, decision)
        );
        actions.append(btn);
      });

      card.append(actions);
    }

    target.append(card);
  });
}
function openReview(card, recId, decision) {
    card.querySelector(".review-form")?.remove();

    const form = element("form", "review-form");

    const decisionLabels = {
      approuvee: ["Approuver", "Approve"],
      modifiee: ["Modifier", "Modify"],
      rejetee: ["Rejeter", "Reject"]
    };

    const decisionLabel = element("label", "", "");
    form.append(decisionLabel);

    const comment = element("textarea");
    comment.required = true;
    comment.maxLength = 2000;
    form.append(comment);

    let modified = null;
    let modifiedLabel = null;

    if (decision === "modifiee") {
      modifiedLabel = element("label", "", "");
      form.append(modifiedLabel);

      modified = element("textarea");
      modified.required = true;
      modified.maxLength = 5000;
      form.append(modified);
    }

    const submit = element("button", "primary", "");
    submit.type = "submit";
    form.append(submit);

    function updateReviewLanguage() {
      const en = document.documentElement.lang === "en";
      const labels = decisionLabels[decision] || [decision, decision];

      decisionLabel.textContent = en
        ? `Decision: ${labels[1]}. Teacher's comment:`
        : `Décision : ${labels[0]}. Commentaire de l'enseignant :`;

      comment.placeholder = en
        ? "Reason for the decision (synthetic data)"
        : "Motivation de la décision (données synthétiques)";

      if (modifiedLabel) {
        modifiedLabel.textContent = en
          ? "Modified educational content:"
          : "Contenu pédagogique modifié :";
      }

      submit.textContent = en
        ? "Save decision"
        : "Enregistrer la décision";
    }

    updateReviewLanguage();

    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      submit.disabled = true;

      try {
        const body = {
          decision,
          commentaire: comment.value.trim()
        };

        if (modified) {
          body.contenu_modifie = modified.value.trim();
        }

        await request(
          `/recommendations/${encodeURIComponent(recId)}/review`,
          {
            method: "POST",
            body: JSON.stringify(body),
            headers: {}
          }
        );

        notify("Décision enregistrée par le serveur.");
        await loadHistory();
        await loadPublished();
      } catch (e) {
        notify(e.message, true);
      } finally {
        submit.disabled = false;
      }
    });

    form.updateReviewLanguage = updateReviewLanguage;
    card.append(form);
  }
  async function loadPublished(){if(!state.selected)return;try{const result=await request(`/learners/${encodeURIComponent(state.selected)}/review-history`);
    state.history=arr(result,"history","historique","reviews","data","results");
    const pending=state.history.filter(r=>String(pick(r,"statut","recommendationStatus","statut_recommandation")||"").toLowerCase()==="en_attente");
    if(pending.length)renderRecommendations({recommendations:pending});
  }catch(e){notify(`Historique : ${e.message}`,true);}}
  async function loadHistory(){if(!state.selected)return;const target=$("history");try{const result=await request(`/learners/${encodeURIComponent(state.selected)}/review-history`);const rows=arr(result,"history","historique","reviews","data","results");state.history=rows;target.replaceChildren();
    if(!rows.length){target.append(element("p","muted","Aucune décision enregistrée."));return;}
    function refreshHistoryLanguageV03() {
      document.querySelectorAll(
        "#history [data-history-recommendation-id]"
      ).forEach(title => {
        const id = title.dataset.historyRecommendationId || "—";
        const status = (
          title.dataset.historyStatus || "en_attente"
        ).toLowerCase();

        const labels = {
          en_attente: ["En attente", "Pending"],
          approuvee: ["Approuvée", "Approved"],
          modifiee: ["Modifiée", "Modified"],
          rejetee: ["Rejetée", "Rejected"],
          pending: ["En attente", "Pending"],
          approved: ["Approuvée", "Approved"],
          modified: ["Modifiée", "Modified"],
          rejected: ["Rejetée", "Rejected"]
        };

        const en = currentLanguageV03 === "en";
        const label = labels[status]
          ? labels[status][en ? 1 : 0]
          : title.dataset.historyStatus;

        title.textContent =
          `${en ? "Recommendation" : "Recommandation"} ${id} · ${label}`;
      });
    }
    function historyLabelV03(row) {
      const id = pick(row, "id_recommandation", "recommendationId") || "—";
      const rawStatus = String(
        pick(row, "decision", "statut", "status", "statut_recommandation") ||
        "en_attente"
      );

      const status = rawStatus.toLowerCase();

      const labels = {
        en_attente: ["En attente", "Pending"],
        approuvee: ["Approuvée", "Approved"],
        modifiee: ["Modifiée", "Modified"],
        rejetee: ["Rejetée", "Rejected"],
        pending: ["En attente", "Pending"],
        approved: ["Approuvée", "Approved"],
        modified: ["Modifiée", "Modified"],
        rejected: ["Rejetée", "Rejected"]
      };

      const en = document.documentElement.lang === "en";
      const label = labels[status]
        ? labels[status][en ? 1 : 0]
        : rawStatus;

      return `${en ? "Recommendation" : "Recommandation"} ${id} · ${label}`;
    }
    rows.forEach(row=>{const box=element("div","history-item");const title=element("strong","",historyLabelV03(row));title.dataset.historyRecommendationId=String(pick(row,"id_recommandation","recommendationId")||"");title.dataset.historyStatus=String(pick(row,"decision","statut","status","statut_recommandation")||"en_attente");box.append(title);const c=pick(row,"commentaire","comment","contenu","justification");if(c)box.append(element("p","",String(c)));const d=pick(row,"date_validation","date","reviewedAt");if(d)box.append(element("small","",String(d)));target.append(box);});
  }catch(e){target.replaceChildren(element("p","muted",e.message));}}
  async function selectLearner(id){state.selected=id;state.analysis=null;$("refresh").disabled=false;$("history-refresh").disabled=false;$("publish").disabled=false;
    const learner=state.learners.find(l=>idOf(l)===id);$("learner-name").textContent=learner?nameOf(learner):id;$("learner-subtitle").textContent=`Identifiant : ${id} · Données synthétiques`;
    document.querySelectorAll(".learner").forEach(b=>b.classList.toggle("active",b.querySelector("small")?.textContent===id));
    $("chart").replaceChildren(element("p","muted","Chargement de l'analyse…"));
    try{const [analysis,recs]=await Promise.all([request(`/learners/${encodeURIComponent(id)}/analysis`),request(`/learners/${encodeURIComponent(id)}/recommendations`)]);
      if(state.selected!==id)return;state.analysis=analysis;const metrics=metricsFromAnalysis(analysis);drawChart(metrics, analysis);drawMetrics(metrics);renderRecommendations(recs);
      await loadHistory(); await loadPublished();
    }catch(e){if(state.selected===id)notify(e.message,true);}
  }
  $("login-form").addEventListener("submit",async ev=>{ev.preventDefault();const button=ev.currentTarget.querySelector("button");button.disabled=true;
    try{await request("/login",{method:"POST",body:JSON.stringify({identifier:$("identifier").value.trim(),password:$("password").value})});$("password").value="";showDashboard();await loadLearners();notify("Connexion enseignant réussie.");}
    catch(e){notify(e.message,true);}finally{button.disabled=false;$("password").value="";}
  });
  $("refresh").addEventListener("click",()=>state.selected&&selectLearner(state.selected));
  $("history-refresh").addEventListener("click",loadHistory);
  $("publish").addEventListener("click",async()=>{if(!state.selected)return;const b=$("publish");b.disabled=true;
    try{const result=await request(`/learners/${encodeURIComponent(state.selected)}/publish`,{method:"POST",body:"{}",headers:{}});notify(result.reused?"Publication existante réutilisée.":"Analyse publiée pour validation humaine.");await loadHistory();
      const recs=arr(result,"recommendations","recommandations");if(recs.length)renderRecommendations({recommendations:recs});
    }catch(e){notify(e.message,true);}finally{b.disabled=false;}
  });
  // EDUKAI V0.3 - Interface bilingue FR/EN
  // Les donnees pedagogiques du serveur ne sont pas traduites.

  const translationsV03 = new Map([
    [
      "Recommandation reservee au test d'annulation d'une validation humaine V0.3.",
      "Recommendation reserved for testing the cancellation of a human validation in V0.3."
    ],
    [
      "EDUKAI-V03-TEST-ROLLBACK-212 : proposer un accompagnement pedagogique progressif en mathematiques pour Aminata Camara.",
      "EDUKAI-V03-TEST-ROLLBACK-212: provide progressive educational support in mathematics for Aminata Camara."
    ],
    [
      "EDUKAI-V03-TEST-ROLLBACK-212 : proposer un accompagnement pédagogique progressif en mathématiques pour Aminata Camara.",
      "EDUKAI-V03-TEST-ROLLBACK-212: provide progressive educational support in mathematics for Aminata Camara."
    ],
    [
      "Recommandation réservée au test d'annulation d'une validation humaine V0.3.",
      "Recommendation reserved for testing the cancellation of a human validation in V0.3."
    ],
    ["normale", "Normal"],
    ["haute", "High"],
    ["basse", "Low"],
    ["elevee", "High"],
    ["élevée", "High"],
    ["en_attente", "Pending"],
    ["approuvee", "Approved"],
    ["modifiee", "Modified"],
    ["rejetee", "Rejected"],
    ["En attente", "Pending"],
    ["Proposition", "Proposal"],
    ["ESPACE ENSEIGNANT", "TEACHER PORTAL"],
    ["Bienvenue sur LongView", "Welcome to LongView"],
    ["Connectez-vous avec le compte enseignant de démonstration V0.3.",
     "Sign in with the V0.3 demonstration teacher account."],
    ["Identifiant", "Username"],
    ["Mot de passe", "Password"],
    ["Se connecter", "Sign in"],
    ["Votre mot de passe n'est pas enregistré dans cette page.",
     "Your password is not stored on this page."],
    ["Données synthétiques · Démonstration locale",
     "Synthetic data · Local demonstration"],
    ["TABLEAU DE BORD PÉDAGOGIQUE", "LEARNING DASHBOARD"],
    ["Suivi longitudinal des apprenants", "Longitudinal learner tracking"],
    ["Des preuves pour éclairer la décision de l'enseignant.",
     "Evidence to support teacher decisions."],
    ["Validation humaine obligatoire", "Human review required"],
    ["Apprenants", "Learners"],
    ["Dossiers disponibles", "Available learner records"],
    ["Période", "Period"],
    ["Trois années scolaires", "Three school years"],
    ["Analyse", "Analysis"],
    ["Traçable", "Traceable"],
    ["Recommandations explicables", "Explainable recommendations"],
    ["Sélectionnez un dossier", "Select a learner"],
    ["DOSSIER PÉDAGOGIQUE", "LEARNER PROFILE"],
    ["Choisissez un apprenant", "Choose a learner"],
    ["Les données proviennent du serveur V0.3.",
     "Data is retrieved from the V0.3 server."],
    ["Actualiser", "Refresh"],
    ["Progression par indicateur", "Progress by indicator"],
    ["AIDE À LA DÉCISION", "DECISION SUPPORT"],
    ["Recommandations pédagogiques", "Pedagogical recommendations"],
    ["Publier pour validation", "Submit for review"],
    ["Les suggestions doivent être examinées par un enseignant avant toute utilisation.",
     "Suggestions must be reviewed by a teacher before use."],
    ["Aucune recommandation affichée.", "No recommendations displayed."],
    ["TRAÇABILITÉ", "TRACEABILITY"],
    ["Historique des décisions", "Decision history"],
    ["Choisissez un apprenant.", "Choose a learner."],
    ["Approuver", "Approve"],
    ["Modifier", "Modify"],
    ["Rejeter", "Reject"],
    ["Enregistrer la décision", "Save decision"],
    ["Mathématiques", "Mathematics"],
    ["Sciences", "Science"],
    ["Langues", "Languages"],
    ["Assiduité", "Attendance"],
    ["Aucune décision enregistrée.", "No decision recorded."],
    ["Aucune recommandation disponible.", "No recommendations available."],
    ["Commentaire de l'enseignant :", "Teacher's comment:"],
    ["Contenu pédagogique modifié :", "Modified educational content:"],
    ["Motivation de la décision (données synthétiques)", "Reason for the decision (synthetic data)"]
  ]);

  const originalTextV03 = new WeakMap();
  let currentLanguageV03 = "fr";
  let translatingV03 = false;

  const languageBoxV03 = document.createElement("div");
  languageBoxV03.className = "edukai-language-switch";

  const languageLabelV03 = document.createElement("label");
  languageLabelV03.htmlFor = "edukai-language";
  languageLabelV03.textContent = "Langue / Language";

  const languageSelectV03 = document.createElement("select");
  languageSelectV03.id = "edukai-language";
  languageSelectV03.setAttribute("aria-label", "Language / Langue");

  [["fr", "Français"], ["en", "English"]].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    languageSelectV03.append(option);
  });

  languageBoxV03.append(languageLabelV03, languageSelectV03);

  const headerRightV03 = document.querySelector(".topright");
  if (headerRightV03) {
    headerRightV03.prepend(languageBoxV03);
  }

  const languageStyleV03 = document.createElement("style");
  languageStyleV03.textContent = `
    .topright {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .edukai-language-switch {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #164d59;
    }
    .edukai-language-switch select {
      border: 1px solid #c7dce2;
      border-radius: 9px;
      background: white;
      color: #14364b;
      padding: 8px 12px;
      font: inherit;
      cursor: pointer;
    }
    @media (max-width: 650px) {
      .edukai-language-switch label {
        display: none;
      }
    }
  `;
  document.head.append(languageStyleV03);

  function applyLanguageV03() {
    if (translatingV03) return;
    translatingV03 = true;

    try {
      document.documentElement.lang = currentLanguageV03;

      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT
      );

      let node;

      while ((node = walker.nextNode())) {
        const parent = node.parentElement;

        if (!parent ||
            parent.closest("script,style,textarea,option,.review-form")) {
          continue;
        }

        const existing = originalTextV03.get(node);
        const original = existing !== undefined
          ? existing
          : node.nodeValue;

        const trimmed = original.trim();

        const recommendationMatch = /^Recommandation (\d+)$/.exec(trimmed);

        if (recommendationMatch) {
          if (existing === undefined) {
            originalTextV03.set(node, original);
          }

          const label = currentLanguageV03 === "en"
            ? "Recommendation"
            : "Recommandation";

          node.nodeValue = original.replace(
            trimmed,
            `${label} ${recommendationMatch[1]}`
          );
          continue;
        }

        const statusParts = trimmed.split(" - ");

        if (
          statusParts.length === 2 &&
          statusParts.every(part => translationsV03.has(part))
        ) {
          if (existing === undefined) {
            originalTextV03.set(node, original);
          }

          const translatedParts = currentLanguageV03 === "en"
            ? statusParts.map(part => translationsV03.get(part))
            : statusParts;

          const leading = original.match(/^\s*/)?.[0] || "";
          const trailing = original.match(/\s*$/)?.[0] || "";

          node.nodeValue =
            leading + translatedParts.join(" - ") + trailing;

          continue;
        }
        if (!translationsV03.has(trimmed)) {
          continue;
        }

        if (existing === undefined) {
          originalTextV03.set(node, original);
        }

        const translated = currentLanguageV03 === "en"
          ? translationsV03.get(trimmed)
          : trimmed;

        const leading = original.match(/^\s*/)?.[0] || "";
        const trailing = original.match(/\s*$/)?.[0] || "";
        const nextValue = leading + translated + trailing;

        if (node.nodeValue !== nextValue) {
          node.nodeValue = nextValue;
        }
      }
    } finally {
      translatingV03 = false;
    }
  }

  let languageUpdatePendingV03 = false;

  const languageObserverV03 = new MutationObserver(() => {
    if (translatingV03 || languageUpdatePendingV03) return;

    languageUpdatePendingV03 = true;

    queueMicrotask(() => {
      languageUpdatePendingV03 = false;
      applyLanguageV03();
    });
  });

  languageObserverV03.observe(document.body, {
    childList: true,
    subtree: true
  });

  languageSelectV03.addEventListener("change", () => {
    currentLanguageV03 = languageSelectV03.value;
    applyLanguageV03();
    refreshHistoryLanguageV03();

    document.querySelectorAll(".review-form").forEach(form => {
      if (typeof form.updateReviewLanguage === "function") {
        form.updateReviewLanguage();
      }
    });
  });

  function initPedagogicalTranslationV03() {
    const direction = $("translation-direction");
    const source = $("translation-source");
    const submit = $("translation-submit");
    const result = $("translation-result");

    if (!direction || !source || !submit || !result) return;

    const samples = {
      "fr-en": {
        text: "L'enseignant recommande trois exercices de mathematiques par semaine.",
        sourceLanguage: "fr",
        targetLanguage: "en"
      },
      "en-fr": {
        text: "The teacher recommends a weekly mathematics review session.",
        sourceLanguage: "en",
        targetLanguage: "fr"
      }
    };

    function refreshSample() {
      const sample = samples[direction.value];
      if (!sample) return;
      source.textContent = sample.text;
      result.textContent = "";
    }

    direction.addEventListener("change", refreshSample);

    submit.addEventListener("click", async () => {
      const sample = samples[direction.value];
      if (!sample) return;

      submit.disabled = true;
      result.textContent = "Traduction en cours...";

      try {
        const response = await request("/translate", {
          method: "POST",
          body: JSON.stringify(sample)
        });

        result.textContent =
          response.translated || "Traduction indisponible.";
      } catch (error) {
        result.textContent = error.message;
      } finally {
        submit.disabled = false;
      }
    });

    refreshSample();
  }

  initPedagogicalTranslationV03();
  applyLanguageV03();
  // Aucun appel automatique à /learners sans authentification.
})();
