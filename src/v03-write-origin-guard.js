"use strict";

const ALLOWED_ORIGIN = "http://127.0.0.1:3003";

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