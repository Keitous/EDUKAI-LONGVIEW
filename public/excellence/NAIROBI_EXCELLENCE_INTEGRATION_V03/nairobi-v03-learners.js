"use strict";

(() => {
  const select = document.getElementById("learner-select");
  const api = window.NairobiV03API;

  if (!select || !api) {
    console.error("[Nairobi] Module apprenants indisponible.");
    return;
  }

  // TGN-61.20.007-C : selection conservee dans cet onglet.
  const selectionKey = "edukai-nairobi-selected-learner";

  select.addEventListener("change", () => {
    const selected = select.value;

    if (selected) {
      sessionStorage.setItem(selectionKey, selected);
    } else {
      sessionStorage.removeItem(selectionKey);
    }
  });

  async function loadLearners() {
    const previousSelection =
      sessionStorage.getItem(selectionKey) || "";
    const language = document.documentElement.lang === "en" ? "en" : "fr";

    select.disabled = true;

    try {
      const learners = await api.getLearners();

      select.replaceChildren();

      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.dataset.i18n = "chooseLearner";
      placeholder.textContent = language === "en"
        ? "Choose a demonstration learner"
        : "Choisir un dossier de démonstration";

      select.appendChild(placeholder);

      for (const learner of learners) {
        const id = String(
          learner.id_apprenant ||
          learner.learnerId ||
          learner.id ||
          ""
        );

        const name = String(
          learner.nom_complet ||
          learner.nom ||
          learner.name ||
          id
        );

        if (!/^LRN[0-9]{3,10}$/.test(id)) continue;

        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${id} — ${name}`;

        select.appendChild(option);
      }

      const available = Array.from(select.options)
        .some(option => option.value === previousSelection);

      select.value = available ? previousSelection : "";

      select.dispatchEvent(
        new Event("change", { bubbles: true })
      );

      console.info(
        "[Nairobi] Apprenants charges :",
        select.options.length - 1
      );
    } catch (error) {
      console.error(
        "[Nairobi] Chargement des apprenants impossible :",
        error.message
      );
    } finally {
      select.disabled = false;
    }
  }

  loadLearners();
})();