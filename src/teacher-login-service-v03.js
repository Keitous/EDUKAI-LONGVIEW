"use strict";

const {
  findTeacherAccount
} = require("./teacher-account-repository-v03");

const {
  hashPassword,
  verifyPassword
} = require("./password-security-v03");

const DUMMY_HASH = hashPassword(
  "EDUKAI-V03-DUMMY-NOT-A-REAL-PASSWORD"
);

async function authenticateTeacher(identifier, password) {
  if (
    typeof identifier !== "string" ||
    identifier.length < 1 ||
    identifier.length > 150 ||
    typeof password !== "string" ||
    Buffer.byteLength(password, "utf8") > 1024
  ) {
    return null;
  }

  const account = await findTeacherAccount(identifier);

  const storedHash =
    typeof account?.mot_de_passe_hash === "string"
      ? account.mot_de_passe_hash
      : DUMMY_HASH;

  const valid = verifyPassword(
    password,
    storedHash
  );

  if (!account || account.actif !== true || !valid) {
    return null;
  }

  const teacherId = Number(account.id_enseignant);

  if (!Number.isSafeInteger(teacherId) || teacherId <= 0) {
    throw new Error(
      "EDUKAI V0.3 : identite enseignant invalide."
    );
  }

  return Object.freeze({
    id_enseignant: teacherId,
    identifiant_connexion: account.identifiant_connexion,
    role: "enseignant"
  });
}

module.exports = {
  authenticateTeacher
};
