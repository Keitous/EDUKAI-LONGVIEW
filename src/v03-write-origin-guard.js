"use strict";
// EDUKAI_CLOUD_PATCH_V1
if (process.env.EDUKAI_V03_MODE === "nairobi_cloud") {
function requireTrustedWriteOrigin(req, res, next) {
    const configured = process.env.EDUKAI_PUBLIC_ORIGIN;

    let allowed;

    try {
        allowed = new URL(configured).origin;

        if (
            !configured ||
            !configured.startsWith("https://") ||
            configured !== allowed
        ) {
            throw new Error("Origine HTTPS invalide");
        }
    } catch {
        return res.status(500).json({
            error: "Origine cloud non configuree."
        });
    }

    const origin = req.get("origin");
    const referer = req.get("referer");

    try {
        const supplied = origin
            ? new URL(origin).origin
            : referer
                ? new URL(referer).origin
                : null;

        if (supplied !== allowed) {
            return res.status(403).json({
                error: "Origine HTTP non autorisee."
            });
        }

        return next();
    } catch {
        return res.status(403).json({
            error: "Origine HTTP invalide."
        });
    }
}

module.exports = { requireTrustedWriteOrigin };
} else {
"use strict";

const MODE_V03 = process.env.EDUKAI_V03_MODE || "normal";

if (!["normal", "jury", "tests_grandeur_nature", "nairobi_reset_test"].includes(MODE_V03)) {
  throw new Error("EDUKAI_V03_MODE invalide pour le controle d'origine HTTP.");
}

const ALLOWED_ORIGIN = MODE_V03 === "jury"
  ? "http://127.0.0.1:3004"
  : MODE_V03 === "tests_grandeur_nature"
    ? "http://127.0.0.1:3005"
    : MODE_V03 === "nairobi_reset_test"
      ? "http://127.0.0.1:3006"
      : "http://127.0.0.1:3003";

function requireTrustedWriteOrigin(req, res, next) {
  const origin = req.get("origin");
  const referer = req.get("referer");

  if (origin) {
    if (origin !== ALLOWED_ORIGIN) {
      return res.status(403).json({
        error: "Origine HTTP non autorisee."
      });
    }

    return next();
  }

  if (referer) {
    try {
      if (new URL(referer).origin !== ALLOWED_ORIGIN) {
        return res.status(403).json({
          error: "Referent HTTP non autorise."
        });
      }

      return next();
    } catch {
      return res.status(403).json({
        error: "Referent HTTP invalide."
      });
    }
  }

  return res.status(403).json({
    error: "Origine de la requete non verifiable."
  });
}

module.exports = {
  requireTrustedWriteOrigin
};
}
