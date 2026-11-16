"use strict";

(() => {
  const api = window.NairobiV03API;
  const language = document.getElementById("language-select");
  const list = document.getElementById("nd-recommendations-list");
  const status = document.getElementById("nd-recommendations-status");

  if (!api || !list || !status) return;

  const publicationControls =
    document.getElementById("nd-publication-controls");
  const publishButton =
    document.getElementById("nd-publish-recommendations");
  const publicationStatus =
    document.getElementById("nd-publication-status");

  const reviewNotice = document.getElementById("nd-review-history-notice");
  let historyLoaded = false;

  function updateReviewPublicationState() {
    if (!current?.recommendations?.length) return;

    const summary = getReviewSummary();

    const allDecided =
      historyLoaded &&
      summary.total > 0 &&
      summary.decided === summary.total;

    const allMatched =
      historyLoaded &&
      current.recommendations.every(rec =>
        Boolean(matchHistoricalRecommendation(rec))
      );

    if (allMatched) published = true;

    if (publishButton) {
      publishButton.disabled =
        !historyLoaded || publishing || published;

      if (allDecided) {
        publishButton.textContent = en()
          ? "Human review completed"
          : "Validation humaine déjà effectuée";
      }
    }

    if (publicationStatus) {
      if (!historyLoaded) {
        publicationStatus.textContent = en()
          ? "Review status temporarily unavailable."
          : "État des validations temporairement indisponible.";
      } else if (allDecided) {
        publicationStatus.textContent = en()
          ? "All recommendations have been reviewed by the teacher."
          : "Toutes les recommandations ont été examinées par l'enseignant.";
      } else if (allMatched) {
        publicationStatus.textContent = en()
          ? "Recommendations already submitted for human review."
          : "Recommandations déjà soumises pour validation humaine.";
      }
    }

    if (reviewNotice) {
      reviewNotice.textContent = !historyLoaded
        ? (en()
          ? "Human review history temporarily unavailable."
          : "Historique des validations temporairement indisponible.")
        : summary.decided > 0
          ? (en()
            ? `${summary.decided} teacher decisions recorded for these recommendations.`
            : `${summary.decided} décisions humaines enregistrées pour ces recommandations.`)
          : (en()
            ? "No teacher decision recorded for these recommendations."
            : "Aucune décision humaine enregistrée pour ces recommandations.");
    }
  }
  function updatePublicationControls() {
    if (!publicationControls || !publishButton) return;

    const hasRecommendations =
      current &&
      Array.isArray(current.recommendations) &&
      current.recommendations.length > 0;

    publicationControls.hidden = !hasRecommendations;
    publishButton.disabled = !hasRecommendations || publishing || published;

    publishButton.textContent = en()
      ? "Submit for human review"
      : "Soumettre pour validation humaine";

    if (publicationStatus) {
      publicationStatus.textContent = !hasRecommendations
        ? ""
        : publicationMessage
          ? (en() ? publicationMessage.en : publicationMessage.fr)
          : (en()
            ? "Ready to submit for human review."
            : "Prêt pour la validation humaine.");
    }
  }
  let publishing = false;
  let published = false;
  let publicationMessage = null;

  function selectedLearnerId() {
    return document.getElementById("learner-select")?.value || "";
  }

  async function publishCurrentRecommendations() {
    if (publishing || published || !historyLoaded || !current?.recommendations?.length) return;

    const learnerId = current.learnerId;

    if (!learnerId || selectedLearnerId() !== learnerId) return;

    const confirmed = window.confirm(en()
      ? `Submit recommendations for ${learnerId} for human review?`
      : `Soumettre les recommandations de ${learnerId} pour validation humaine ?`);

    if (!confirmed) return;

    publishing = true;
    publishButton.disabled = true;
    const publicationVersion = version;

    if (publicationStatus) {
      publicationStatus.textContent = en()
        ? "Publishing recommendations..."
        : "Publication des recommandations...";
    }

    try {
      const result = await api.publishRecommendations(learnerId);

      if (result.status === "no_recommendation") {
        throw new Error("Aucune recommandation à publier.");
      }

      if (publicationVersion !== version ||
          selectedLearnerId() !== learnerId) {
        return;
      }

      published = true;
      publicationMessage = {
        fr: `${result.recommendations.length} recommandations enregistrées dans PostgreSQL.`,
        en: `${result.recommendations.length} recommendations registered in PostgreSQL.`
      };
      updatePublicationControls();

      console.info("[Nairobi publication]", {
        learnerId,
        reused: result.reused,
        status: result.status,
        count: result.recommendations.length
      });

    } catch (error) {
      console.error("[Nairobi publication]", error);

      if (publicationVersion === version &&
          selectedLearnerId() === learnerId) {
        publicationMessage = error.status === 401
          ? {
              fr: "Session expirée. Veuillez vous reconnecter.",
              en: "Session expired. Please sign in again."
            }
          : {
              fr: "Publication impossible. Vérifiez le serveur avant de réessayer.",
              en: "Publication failed. Check the server before retrying."
            };
      }
    } finally {
      publishing = false;
      if (publicationVersion === version) {
        updatePublicationControls();
      }
    }
  }

  publishButton?.addEventListener(
    "click",
    publishCurrentRecommendations
  );
  let version = 0;
  let current = null;

  const names = {
    mathematics: ["Mathématiques","Mathematics"],
    science: ["Sciences","Science"],
    language: ["Langues","Languages"],
    attendance: ["Assiduité","Attendance"]
  };

  const priorities = {
    high: ["Priorité élevée","High priority"],
    monitoring: ["Suivi pédagogique","Educational monitoring"],
    positive: ["Valorisation des progrès","Recognizing progress"]
  };

  function en() {
    return language?.value === "en";
  }

  function label(pair) {
    return pair[en() ? 1 : 0];
  }

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = text;
    return node;
  }

  function translateRecommendation(rec) {
    const subject = label(names[rec.subject] || [rec.subject,rec.subject]);
    const observation = String(rec.observation || "");
    const action = String(rec.action || "");

    if (!en()) return { observation, action };

    const number = observation.match(/(\d+(?:[.,]\d+)?)/)?.[1] || "";

    if (rec.priority === "monitoring" && number) {
      return {
        observation: `Improvement of ${number} points, the lowest among the subjects analyzed.`,
        action: `Discuss possible additional support needs in ${subject} with the teacher.`
      };
    }

    if (rec.priority === "positive" && number) {
      return {
        observation: `Improvement of ${number} points.`,
        action: `Recognize progress in ${subject} and identify effective teaching practices.`
      };
    }

    if (rec.priority === "high" && number) {
      return {
        observation: `Decrease of ${number} points.`,
        action: `Examine difficulties in ${subject} and propose targeted support.`
      };
    }

    return { observation, action };
  }

  let reviewHistory = [];

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function matchHistoricalRecommendation(rec) {
    const action = normalizeText(rec.action);
    const observation = normalizeText(rec.observation);

    const period = current?.period;

    const matches = reviewHistory.filter(item => {
      const samePeriod =
        period &&
        String(item.periode_debut) === String(period.from) &&
        String(item.periode_fin) === String(period.to);

      return samePeriod &&
        normalizeText(item.contenu) === action &&
        normalizeText(item.justification) === observation;
    });

    return matches.length === 1 ? matches[0] : null;
  }

  function getReviewSummary() {
    const recs = current?.recommendations || [];
    const matched = recs.map(matchHistoricalRecommendation);

    const decisions = matched.filter(item =>
      item && ["approuvee", "modifiee", "rejetee"].includes(item.statut)
      && item.decision
    );

    const pending = matched.filter(item =>
      !item || item.statut === "en_attente"
    );

    return {
      total: recs.length,
      decided: decisions.length,
      pending: pending.length
    };
  }
  function reviewLabel(item) {
    const values = {
      approuvee: ["Approuvée", "Approved"],
      modifiee: ["Modifiée", "Modified"],
      rejetee: ["Rejetée", "Rejected"],
      en_attente: ["En attente", "Pending"]
    };

    return label(values[item.statut] || [
      item.statut || "—",
      item.statut || "—"
    ]);
  }

  function translateTeacherContent(value) {
    const original = String(value || "");
    if (!en()) return original;

    const translations = new Map([
      [
        "Après examen des résultats d'Aminata Camara, je constate une progression de 25 points en mathématiques sur la période 2023–2026. Je souhaite adapter la recommandation initiale afin de consolider ses acquis, sans lui imposer une charge de travail excessive.",
        "After reviewing Aminata Camara's results, I observe a 25-point improvement in mathematics over the 2023–2026 period. I would like to adapt the initial recommendation to consolidate her learning while avoiding an excessive workload."
      ],
      [
        "Proposer à Aminata Camara une séance hebdomadaire d'approfondissement en mathématiques, comprenant des exercices pratiques et des activités de résolution de problèmes adaptés à son niveau. Valoriser ses progrès et effectuer un suivi pédagogique régulier. La fréquence des activités pourra être ajustée par l'enseignant selon les observations réalisées en classe.",
        "Offer Aminata Camara a weekly mathematics enrichment session, including practical exercises and problem-solving activities suited to her level. Recognize her progress and provide regular educational follow-up. The teacher may adjust the frequency of these activities based on classroom observations."
      ],
      [
        "Recommandation approuvee pour la demonstration pedagogique EDUKAI V0.3.",
        "Recommendation approved for the EDUKAI V0.3 educational demonstration."
      ]
    ]);

    return translations.get(original) || original;
  }
  function appendReviewDetails(card, rec) {
    const item = matchHistoricalRecommendation(rec);
    if (!item) return;

    const heading = element(
      "p",
      `${en() ? "Teacher review" : "Validation humaine"} : ${reviewLabel(item)}`,
      "nd-summary"
    );
    heading.style.fontWeight = "700";
    heading.style.marginTop = "10px";
    card.append(heading);

    // TGN-61.20.005-B : libelles en gras, contenu en texte.
    if (item.commentaire) {
      const paragraph = element("p", "", "nd-summary");
      const label = document.createElement("strong");
      label.textContent = en()
        ? "Teacher's comment :"
        : "Commentaire de l'enseignant :";

      paragraph.append(
        label,
        document.createTextNode(
          " " + translateTeacherContent(item.commentaire)
        )
      );
      card.append(paragraph);
    }

    if (item.contenu_modifie) {
      const paragraph = element("p", "", "nd-summary");
      const label = document.createElement("strong");
      label.textContent = en()
        ? "Modified educational content :"
        : "Contenu pédagogique modifié :";

      paragraph.append(
        label,
        document.createTextNode(
          " " + translateTeacherContent(item.contenu_modifie)
        )
      );
      card.append(paragraph);
    }
  }
  let reviewSubmitting = false;
  let reviewOutcomeUncertain = false;
  let reviewSuccess = null;

  const reviewSuccessLabels = {
    approuvee: [
      "Approbation effectuée avec succès.",
      "Recommendation approved successfully."
    ],
    modifiee: [
      "Modification effectuée avec succès.",
      "Recommendation modified successfully."
    ],
    rejetee: [
      "Rejet effectué avec succès.",
      "Recommendation rejected successfully."
    ]
  };

  function showReviewSuccess() {
    let notice = document.getElementById("nd-review-success");

    if (!notice) {
      notice = document.createElement("p");
      notice.id = "nd-review-success";
      notice.setAttribute("role", "status");
      notice.setAttribute("aria-live", "polite");
      notice.style.padding = "12px 16px";
      notice.style.margin = "12px 0";
      notice.style.border = "1px solid #86c7a5";
      notice.style.borderRadius = "8px";
      notice.style.backgroundColor = "#edf9f1";
      notice.style.color = "#17633a";
      notice.style.fontWeight = "600";
      status.insertAdjacentElement("afterend", notice);
    }

    const labels = reviewSuccess &&
      reviewSuccessLabels[reviewSuccess.decision];

    const visible = Boolean(
      labels &&
      current?.learnerId === reviewSuccess.learnerId &&
      historyLoaded
    );

    notice.hidden = !visible;
    notice.textContent = visible
      ? labels[en() ? 1 : 0]
      : "";
  }

  function appendReviewActions(card, rec) {
    if (!historyLoaded || reviewSubmitting || reviewOutcomeUncertain || typeof api.submitReview !== "function") return;

    const item = matchHistoricalRecommendation(rec);

    if (!item ||
        item.statut !== "en_attente" ||
        !/^[1-9][0-9]*$/.test(String(item.id_recommandation))) {
      return;
    }

    const learnerId = current?.learnerId;
    const recommendationId = String(item.id_recommandation);

    const actions = document.createElement("div");
    actions.className = "nd-review-actions";
    actions.style.display = "flex";
    actions.style.flexWrap = "wrap";
    actions.style.gap = "8px";
    actions.style.marginTop = "12px";

    const decisions = [
      ["approuvee", "Approuver", "Approve"],
      ["modifiee", "Modifier", "Modify"],
      ["rejetee", "Rejeter", "Reject"]
    ];

    const buttons = [];

    for (const [decision, fr, english] of decisions) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = en() ? english : fr;
      button.className = "nd-review-action";

      // TGN-60 : icone SVG decorative, sans modifier le libelle.
      const iconPaths = {
        approuvee: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
        modifiee: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/>',
        rejetee: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>'
      };

      const icon = document.createElementNS(
        "http://www.w3.org/2000/svg", "svg"
      );
      icon.setAttribute("viewBox", "0 0 24 24");
      icon.setAttribute("width", "17");
      icon.setAttribute("height", "17");
      icon.setAttribute("fill", "none");
      icon.setAttribute("stroke", "currentColor");
      icon.setAttribute("stroke-width", "2");
      icon.setAttribute("stroke-linecap", "round");
      icon.setAttribute("stroke-linejoin", "round");
      icon.setAttribute("aria-hidden", "true");
      icon.style.flexShrink = "0";
      icon.innerHTML = iconPaths[decision];

      const buttonLabel = document.createElement("span");
      buttonLabel.className = "nd-review-action-label";
      buttonLabel.textContent = en() ? english : fr;

      button.replaceChildren(icon, buttonLabel);
      button.dataset.decision = decision;
      button.style.padding = "8px 12px";
      button.style.cursor = "pointer";

      button.addEventListener("click", () => {
        if (reviewSubmitting ||
            selectedLearnerId() !== learnerId) return;

        card.querySelector(".nd-review-form")?.remove();

        const form = document.createElement("form");
        form.className = "nd-review-form";
        form.dataset.decision = decision;
        form.style.marginTop = "12px";

        const heading = document.createElement("p");
        heading.textContent = en()
          ? `Decision: ${english}`
          : `Décision : ${fr}`;
        heading.setAttribute("data-review-heading", "");
        form.append(heading);

        const commentLabel = document.createElement("label");
        commentLabel.textContent = en()
          ? "Teacher's comment:"
          : "Commentaire de l'enseignant :";

        const comment = document.createElement("textarea");
        comment.required = true;
        comment.maxLength = 2000;
        comment.rows = 3;
        comment.style.display = "block";
        comment.style.width = "100%";
        comment.style.margin = "8px 0 12px";
        commentLabel.setAttribute("data-review-comment", "");
        commentLabel.append(comment);
        form.append(commentLabel);

        let modified = null;

        if (decision === "modifiee") {
          const modifiedLabel = document.createElement("label");
          modifiedLabel.textContent = en()
            ? "Modified educational content:"
            : "Contenu pédagogique modifié :";

          modified = document.createElement("textarea");
          modified.required = true;
          modified.maxLength = 5000;
          modified.rows = 4;
          modified.style.display = "block";
          modified.style.width = "100%";
          modified.style.margin = "8px 0 12px";
          modifiedLabel.setAttribute("data-review-modified", "");
          modifiedLabel.append(modified);
          form.append(modifiedLabel);
        }

        const save = document.createElement("button");
        save.type = "submit";
        save.textContent = en()
          ? "Save decision"
          : "Enregistrer la décision";
        save.setAttribute("data-review-save", "");
        form.append(save);

        const message = document.createElement("p");
        message.setAttribute("role", "status");
        form.append(message);

        form.addEventListener("submit", async event => {
          event.preventDefault();

          if (reviewSubmitting ||
              selectedLearnerId() !== learnerId ||
              !historyLoaded ||
              matchHistoricalRecommendation(rec)?.id_recommandation != recommendationId) {
            return;
          }

          reviewSubmitting = true;
          const reviewVersion = version;
          save.disabled = true;
          buttons.forEach(btn => { btn.disabled = true; });

          try {
            await api.submitReview(
              recommendationId,
              decision,
              comment.value.trim(),
              modified ? modified.value.trim() : null
            );

            if (reviewVersion !== version ||
                selectedLearnerId() !== learnerId) return;

            await load(learnerId);

            if (selectedLearnerId() !== learnerId ||
                current?.learnerId !== learnerId ||
                !historyLoaded) {
              throw new Error("Historique non confirmé après validation.");
            }

            const confirmed = reviewHistory.some(item =>
              String(item.id_recommandation) === recommendationId &&
              item.statut === decision
            );

            if (!confirmed) {
              throw new Error("Décision absente de l'historique rechargé.");
            }

            reviewSuccess = { learnerId, decision };
            showReviewSuccess();
          } catch (error) {
            reviewOutcomeUncertain = true;
            message.textContent = en()
              ? "Review result uncertain. Refresh the page and check the history before retrying."
              : "Résultat de validation incertain. Actualisez la page et vérifiez l'historique avant de réessayer.";
            message.style.color = "#b42318";
            console.error("[Nairobi teacher review]", error);
          } finally {
            reviewSubmitting = false;
            save.disabled = reviewOutcomeUncertain;
            buttons.forEach(btn => {
              btn.disabled = reviewOutcomeUncertain;
            });
          }
        });

        card.append(form);
        comment.focus();
      });

      buttons.push(button);
      actions.append(button);
    }

    card.append(actions);
  }
  function render() {
    list.replaceChildren();
    showReviewSuccess();

    updatePublicationControls();
    updateReviewPublicationState();

    if (!current) return;

    const recs = current.recommendations;

    if (!recs.length) {
      status.textContent = en()
        ? "No recommendations generated for this learner."
        : "Aucune recommandation générée pour cet apprenant.";
      return;
    }

        const summary = getReviewSummary();

    if (summary.decided === summary.total) {
      status.textContent = en()
        ? `${summary.total} recommendations • ${summary.decided} teacher decisions recorded`
        : `${summary.total} recommandations • ${summary.decided} décisions humaines enregistrées`;
    } else {
      status.textContent = en()
        ? `${summary.total} recommendations • ${summary.pending} awaiting teacher review`
        : `${summary.total} recommandations • ${summary.pending} en attente de validation humaine`;
    }

    for (const rec of recs) {
      const card = element("article","","nd-recommendation-item");
      card.style.borderTop = "1px solid #e0eaf5";
      card.style.padding = "12px 0";

      const title = element(
        "h4",
        label(names[rec.subject] || [rec.subject,rec.subject])
      );

      const priority = element(
        "span",
        label(priorities[rec.priority] ||
          [rec.priority || "—",rec.priority || "—"]),
        "nd-pending"
      );

      const translated = translateRecommendation(rec);

      const observation = element(
        "p",
        translated.observation,
        "nd-summary"
      );

      const action = element(
        "p",
        translated.action,
        "nd-summary"
      );

      card.append(title,priority,observation,action);
      appendReviewDetails(card, rec);
      appendReviewActions(card, rec);
      list.append(card);
    }
  }

  async function load(learnerId) {
    reviewSuccess = null;
    showReviewSuccess();
    const token = ++version;
    published = false;
    publicationMessage = null;
    current = null;
    historyLoaded = false;
    reviewHistory = [];
    updatePublicationControls();
    updateReviewPublicationState();
    list.replaceChildren();
    status.textContent = en()
      ? "Loading recommendations..."
      : "Chargement des recommandations...";

    try {
      const result = await api.getRecommendations(learnerId);

      if (token !== version) return;
      current = result;
      reviewHistory = [];

      try {
        const history = await api.getReviewHistory(learnerId);
        if (token !== version) return;
        reviewHistory = history.history;
        historyLoaded = true;
        reviewOutcomeUncertain = false;
      } catch (historyError) {
        console.warn("[Nairobi review history]", historyError);
      }

      if (token !== version) return;
      render();
    } catch (error) {
      if (token !== version) return;

      status.textContent = en()
        ? "Unable to load recommendations."
        : "Impossible de charger les recommandations.";

      console.error("[Nairobi recommendations]",error);
    }
  }

  function clear() {
    reviewSuccess = null;
    showReviewSuccess();
    version++;
    reviewOutcomeUncertain = false;
    published = false;
    publicationMessage = null;
    current = null;
    historyLoaded = false;
    reviewHistory = [];
    updatePublicationControls();
    updateReviewPublicationState();
    list.replaceChildren();
    status.textContent = en()
      ? "Run an analysis to display recommendations."
      : "Lancez une analyse pour afficher les recommandations.";
  }

  language?.addEventListener("change", () => {
    showReviewSuccess();
    const activeForm = list.querySelector(".nd-review-form");

    if (!activeForm) {
      if (current) render();
      else updatePublicationControls();
      return;
    }

    const actionButtons = list.querySelectorAll(".nd-review-action");

    actionButtons.forEach(button => {
      const decision = button.dataset.decision;
      const labels = {
        approuvee: ["Approuver", "Approve"],
        modifiee: ["Modifier", "Modify"],
        rejetee: ["Rejeter", "Reject"]
      };

      if (labels[decision]) {
        const textNode = button.querySelector(".nd-review-action-label");
        if (textNode) {
          textNode.textContent = label(labels[decision]);
        }
      }
    });

    const heading = activeForm.querySelector("[data-review-heading]");
    const commentLabel = activeForm.querySelector("[data-review-comment]");
    const modifiedLabel = activeForm.querySelector("[data-review-modified]");
    const save = activeForm.querySelector("[data-review-save]");

    if (heading) {
      const decision = activeForm.dataset.decision;
      const labels = {
        approuvee: ["Approuver", "Approve"],
        modifiee: ["Modifier", "Modify"],
        rejetee: ["Rejeter", "Reject"]
      };
      const name = label(labels[decision] || ["Décision", "Decision"]);
      heading.textContent = en() ? `Decision: ${name}` : `Décision : ${name}`;
    }

    if (commentLabel) {
      commentLabel.firstChild.textContent = en()
        ? "Teacher's comment:"
        : "Commentaire de l'enseignant :";
    }

    if (modifiedLabel) {
      modifiedLabel.firstChild.textContent = en()
        ? "Modified educational content:"
        : "Contenu pédagogique modifié :";
    }

    if (save) {
      save.textContent = en()
        ? "Save decision"
        : "Enregistrer la décision";
    }
  });

  window.NairobiV03Recommendations = Object.freeze({
    load,
    clear
  });
})();