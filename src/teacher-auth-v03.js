"use strict";

const {
  requireAuthenticatedTeacher
} = require("./teacher-identity-v03");

function resolveTeacherIdentity(req) {
  if (
    !req ||
    !req.auth ||
    req.auth.verifiedByServer !== true
  ) {
    throw new Error(
      "Acces refuse : authentification serveur requise."
    );
  }

  return requireAuthenticatedTeacher({
    authenticated: true,
    role: req.auth.role,
    id_enseignant: req.auth.id_enseignant
  });
}

module.exports = {
  resolveTeacherIdentity
};
