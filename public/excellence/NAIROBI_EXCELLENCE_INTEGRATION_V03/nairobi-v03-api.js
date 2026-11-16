"use strict";

(function () {
  const API = "/api/v03";

  async function request(path, options = {}) {
    const response = await fetch(API + path, {
      method: options.method || "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(options.body ? {
          "Content-Type": "application/json"
        } : {})
      },
      ...(options.body ? {
        body: JSON.stringify(options.body)
      } : {})
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(
        payload.error || "EDUKAI V0.3 : requete impossible."
      );

      error.status = response.status;
      throw error;
    }

    return payload;
  }

  async function getSession() {
    try {
      const result = await request("/session");

      return {
        authenticated: result.authenticated === true,
        teacher: result.teacher || null
      };
    } catch (error) {
      if (error.status === 401) {
        return {
          authenticated: false,
          teacher: null
        };
      }

      throw error;
    }
  }

  async function login(identifier, password) {
    if (
      typeof identifier !== "string" ||
      typeof password !== "string" ||
      !identifier.trim() ||
      !password
    ) {
      throw new Error("Identifiant et mot de passe requis.");
    }

    return request("/login", {
      method: "POST",
      body: {
        identifier,
        password
      }
    });
  }

  async function logout() {
    return request("/logout", {
      method: "POST"
    });
  }

  async function getLearners() {
    const result = await request("/learners");

    if (!Array.isArray(result.learners)) {
      throw new Error(
        "EDUKAI V0.3 : format de liste inattendu."
      );
    }

    return result.learners;
  }

  async function getAnalysis(learnerId) {
    if (
      typeof learnerId !== "string" ||
      !/^LRN[0-9]{3,10}$/.test(learnerId)
    ) {
      throw new Error("Identifiant apprenant invalide.");
    }

    const result = await request(
      `/learners/${encodeURIComponent(learnerId)}/analysis`
    );

    if (
      result.success !== true ||
      !result.analysis ||
      result.analysis.learnerId !== learnerId
    ) {
      throw new Error("EDUKAI V0.3 : analyse invalide.");
    }

    return result.analysis;
  }
  async function getRecommendations(learnerId) {
    if (typeof learnerId !== "string" ||
        !/^LRN[0-9]{3,10}$/.test(learnerId)) {
      throw new Error("Identifiant apprenant invalide.");
    }

    const payload = await request(
      `/learners/${encodeURIComponent(learnerId)}/recommendations`
    );

    if (payload.success !== true ||
        !payload.result ||
        payload.result.learnerId !== learnerId ||
        !Array.isArray(payload.result.recommendations)) {
      throw new Error("Format de recommandations invalide.");
    }

    return payload.result;
  }
  async function getReviewHistory(learnerId) {
    if (typeof learnerId !== "string" ||
        !/^LRN[0-9]{3,10}$/.test(learnerId)) {
      throw new Error("Identifiant apprenant invalide.");
    }

    const result = await request(
      `/learners/${encodeURIComponent(learnerId)}/review-history`
    );

    if (result.success !== true ||
        result.learnerId !== learnerId ||
        !Array.isArray(result.history)) {
      throw new Error("Format historique invalide.");
    }

    return result;
  }
  async function publishRecommendations(learnerId) {
    if (typeof learnerId !== "string" ||
        !/^LRN[0-9]{3,10}$/.test(learnerId)) {
      throw new Error("Identifiant apprenant invalide.");
    }

    const result = await request(
      `/learners/${encodeURIComponent(learnerId)}/publish`,
      { method: "POST" }
    );

    if (result.status === "no_recommendation") {
      return result;
    }

    if (result.success !== true ||
        result.learnerId !== learnerId ||
        !Array.isArray(result.recommendations)) {
      throw new Error("Reponse de publication invalide.");
    }

    return result;
  }
  async function submitReview(recommendationId, decision, commentaire, contenuModifie = null) {
    const id = String(recommendationId);

    if (!/^[1-9][0-9]*$/.test(id)) {
      throw new Error("Identifiant de recommandation invalide.");
    }

    if (!["approuvee", "modifiee", "rejetee"].includes(decision)) {
      throw new Error("Décision pédagogique invalide.");
    }

    if (typeof commentaire !== "string" ||
        !commentaire.trim() ||
        commentaire.length > 2000) {
      throw new Error("Commentaire enseignant obligatoire (2000 caractères maximum).");
    }

    const body = {
      decision,
      commentaire: commentaire.trim()
    };

    if (decision === "modifiee") {
      if (typeof contenuModifie !== "string" ||
          !contenuModifie.trim() ||
          contenuModifie.length > 5000) {
        throw new Error("Contenu pédagogique modifié obligatoire (5000 caractères maximum).");
      }

      body.contenu_modifie = contenuModifie.trim();
    }

    return request(
      `/recommendations/${encodeURIComponent(id)}/review`,
      {
        method: "POST",
        body
      }
    );
  }
  window.NairobiV03API = Object.freeze({
    getSession,
    login,
    logout,
    getLearners,
    getAnalysis,
    getRecommendations,
    getReviewHistory,
    publishRecommendations,
    submitReview
  });
})();