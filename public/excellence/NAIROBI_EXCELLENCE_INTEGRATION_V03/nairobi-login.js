"use strict";

(function () {
  function init() {
    const api = window.NairobiV03API;
    const language = document.getElementById("language-select");
    const form = document.getElementById("login-form");
    const identifier = document.getElementById("identifier");
    const password = document.getElementById("password");
    const submit = document.getElementById("submit");
    const status = document.getElementById("status");
    const toggle = document.getElementById("toggle-password");

    if (!api || !form || !language) {
      console.error("EDUKAI : modules de connexion indisponibles.");
      return;
    }

    function translate() {
      const lang = language.value === "en" ? "en" : "fr";
      document.documentElement.lang = lang;

      document.querySelectorAll("[data-fr][data-en]")
        .forEach(node => {
          node.textContent = node.dataset[lang];
        });

      toggle.setAttribute(
        "aria-label",
        lang === "en" ? "Show password" : "Afficher le mot de passe"
      );
    }

    language.addEventListener("change", () => {
      sessionStorage.setItem("edukai-nairobi-language", language.value);
      translate();
    });

    const savedLanguage = sessionStorage.getItem("edukai-nairobi-language");
    if (savedLanguage === "en" || savedLanguage === "fr") {
      language.value = savedLanguage;
    }

    toggle.addEventListener("click", () => {
      password.type =
        password.type === "password" ? "text" : "password";
    });

    async function checkSession() {
      try {
        const session = await api.getSession();
        if (session.authenticated) {
          window.location.replace("./index.html");
        }
      } catch (error) {
        status.textContent = "Session indisponible / Session unavailable";
      }
    }

    form.addEventListener("submit", async event => {
      event.preventDefault();
      submit.disabled = true;

      try {
        const result = await api.login(
          identifier.value.trim(),
          password.value
        );

        password.value = "";

        if (result.authenticated === true) {
          window.location.replace("./index.html");
        } else {
          status.textContent =
            language.value === "en"
              ? "Authentication failed."
              : "Échec de l'authentification.";
        }
      } catch (error) {
        password.value = "";
        status.textContent =
          language.value === "en"
            ? "Unable to sign in."
            : "Connexion impossible.";
      } finally {
        submit.disabled = false;
      }
    });

    translate();
    checkSession();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {once:true});
  } else {
    init();
  }
})();