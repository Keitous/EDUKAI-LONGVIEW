"use strict";

(function () {
  const labels = {
    fr: {
      title: "Connexion enseignant",
      identifier: "Identifiant",
      password: "Mot de passe",
      connect: "Se connecter",
      disconnect: "Se déconnecter",
      required: "Veuillez renseigner les deux champs.",
      failed: "Connexion impossible.",
      checking: "Vérification de la session...",
      connected: "Enseignant connecté",
      loading: "Connexion en cours..."
    },
    en: {
      title: "Teacher sign in",
      identifier: "Username",
      password: "Password",
      connect: "Sign in",
      disconnect: "Sign out",
      required: "Please complete both fields.",
      failed: "Sign-in failed.",
      checking: "Checking session...",
      connected: "Teacher connected",
      loading: "Signing in..."
    }
  };

  function language() {
    return document.getElementById("language-select")?.value === "en"
      ? "en"
      : "fr";
  }

  function text(key) {
    return labels[language()][key];
  }

  function createElement(tag, className, content) {
    const node = document.createElement(tag);

    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;

    return node;
  }

  function createPanel(container, onAuthenticated) {
    const api = window.NairobiV03API;

    if (!api) {
      throw new Error("Module NairobiV03API indisponible.");
    }

    const panel = createElement("section", "nairobi-auth-panel");
    const title = createElement("h2");
    const form = createElement("form");

    const identifierLabel = createElement("label");
    const identifier = createElement("input");
    identifier.name = "identifier";
    identifier.autocomplete = "username";
    identifier.required = true;
    identifier.maxLength = 150;

    const passwordLabel = createElement("label");
    const password = createElement("input");
    password.name = "password";
    password.type = "password";
    password.autocomplete = "current-password";
    password.required = true;

    const submit = createElement("button");
    submit.type = "submit";

    const message = createElement("p");
    message.setAttribute("role", "status");
    message.setAttribute("aria-live", "polite");

    identifierLabel.append(identifier);
    passwordLabel.append(password);

    form.append(
      identifierLabel,
      passwordLabel,
      submit
    );

    panel.append(title, form, message);
    container.append(panel);

    function translate() {
      title.textContent = text("title");
      if (identifierLabel.firstChild?.nodeType === 3) {
        identifierLabel.firstChild.remove();
      }

      if (passwordLabel.firstChild?.nodeType === 3) {
        passwordLabel.firstChild.remove();
      }

      identifierLabel.prepend(
        document.createTextNode(text("identifier") + " ")
      );

      passwordLabel.prepend(
        document.createTextNode(text("password") + " ")
      );

      submit.textContent = text("connect");
    }

    async function restoreSession() {
      message.textContent = text("checking");

      try {
        const session = await api.getSession();

        if (session.authenticated) {
          panel.hidden = true;
          message.textContent = "";
          onAuthenticated(session.teacher);
        } else {
          panel.hidden = false;
          message.textContent = "";
        }

        return session;
      } catch (error) {
        panel.hidden = false;
        message.textContent = text("failed");
        throw error;
      }
    }

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (!identifier.value.trim() || !password.value) {
        message.textContent = text("required");
        return;
      }

      submit.disabled = true;
      message.textContent = text("loading");

      try {
        const result = await api.login(
          identifier.value.trim(),
          password.value
        );

        password.value = "";

        if (result.authenticated === true) {
          panel.hidden = true;
          message.textContent = "";
          onAuthenticated(result.teacher);
        } else {
          message.textContent = text("failed");
        }
      } catch (error) {
        message.textContent = text("failed");
        password.value = "";
      } finally {
        submit.disabled = false;
      }
    });

    document.getElementById("language-select")
      ?.addEventListener("change", translate);

    translate();

    return {
      restoreSession,
      show: () => {
        panel.hidden = false;
      },
      hide: () => {
        panel.hidden = true;
      }
    };
  }

  window.NairobiV03Auth = Object.freeze({
    createPanel
  });
})();