"use strict";

(() => {
  const api = window.NairobiV03API;
  const trigger = document.getElementById("nairobi-teacher-trigger");
  const menu = document.getElementById("nairobi-session-menu");
  const button = document.getElementById("nairobi-logout-button");
  const label = document.getElementById("nairobi-logout-label");
  const language = document.getElementById("language-select");

  if (!api || !trigger || !menu || !button || !label) {
    console.error("[Nairobi] Menu enseignant indisponible.");
    return;
  }

  const LOGIN_URL = "./nairobi-login.html";
  const CHECK_INTERVAL_MS = 30000;

  let checking = false;
  let redirecting = false;

  function closeMenu() {
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }

  function updateLanguage() {
    const en = language?.value === "en";
    label.textContent = en ? "Logout" : "Déconnexion";
  }

  function redirectToLogin() {
    if (redirecting) return;
    redirecting = true;
    button.hidden = true;
    closeMenu();
    window.location.replace(LOGIN_URL);
  }

  async function refreshSession() {
    if (checking || redirecting) return;

    checking = true;

    try {
      const session = await api.getSession();

      if (session.authenticated !== true) {
        redirectToLogin();
        return;
      }

      button.hidden = false;
    } catch (error) {
      console.error(
        "[Nairobi] Verification de session indisponible.",
        error
      );
    } finally {
      checking = false;
    }
  }

  trigger.addEventListener("click", async () => {
    if (redirecting) return;

    await refreshSession();

    if (redirecting || button.hidden) return;

    const opening = menu.hidden;
    menu.hidden = !opening;
    trigger.setAttribute("aria-expanded", String(opening));
  });

  document.addEventListener("click", event => {
    if (!trigger.contains(event.target) &&
        !menu.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeMenu();
      trigger.focus();
    }
  });

  button.addEventListener("click", async () => {
    if (redirecting) return;

    button.disabled = true;

    try {
      await api.logout();
      redirectToLogin();
    } catch (error) {
      try {
        const session = await api.getSession();

        if (!session.authenticated) {
          redirectToLogin();
          return;
        }
      } catch {
        // Une panne reseau ne prouve pas une expiration.
      }

      button.disabled = false;

      alert(
        language?.value === "en"
          ? "Logout failed. Please try again."
          : "Déconnexion impossible. Veuillez réessayer."
      );
    }
  });

  language?.addEventListener("change", updateLanguage);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshSession();
  });

  window.addEventListener("focus", refreshSession);

  // AG: Do not keep a truly inactive session alive.
  const AG_ACTIVITY_WINDOW_MS = 2 * 60 * 1000;
  let agLastActivity = Date.now();

  function agRecordActivity() {
    if (!document.hidden) {
      agLastActivity = Date.now();
    }
  }

  document.addEventListener("pointerdown", agRecordActivity, {
    passive: true
  });

  document.addEventListener("keydown", agRecordActivity);

  document.addEventListener("scroll", agRecordActivity, {
    passive: true,
    capture: true
  });

  window.setInterval(() => {
    if (document.hidden) return;

    if (Date.now() - agLastActivity <= AG_ACTIVITY_WINDOW_MS) {
      refreshSession();
    }
  }, CHECK_INTERVAL_MS);

  closeMenu();
  updateLanguage();
  button.hidden = true;
  refreshSession();
})();