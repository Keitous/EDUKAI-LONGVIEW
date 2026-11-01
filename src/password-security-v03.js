"use strict";

const { argon2id } = require("@noble/hashes/argon2");
const { randomBytes, timingSafeEqual } = require("node:crypto");

const PARAMS = Object.freeze({
    t: 3,
    m: 65536,
    p: 1,
    dkLen: 32
});

function validatePassword(password) {
    if (typeof password !== "string" ||
        Buffer.byteLength(password, "utf8") < 12 ||
        Buffer.byteLength(password, "utf8") > 1024) {
        throw new Error("Mot de passe invalide : 12 caracteres minimum, 1024 octets maximum.");
    }
}

function hashPassword(password) {
    validatePassword(password);

    const salt = randomBytes(16);

    const hash = Buffer.from(
        argon2id(Buffer.from(password, "utf8"), salt, PARAMS)
    );

    return [
        "argon2id",
        PARAMS.t,
        PARAMS.m,
        PARAMS.p,
        salt.toString("hex"),
        hash.toString("hex")
    ].join("$");
}

function verifyPassword(password, storedHash) {
    if (typeof password !== "string" ||
        typeof storedHash !== "string") {
        return false;
    }

    const parts = storedHash.split("$");

    if (parts.length !== 6 ||
        parts[0] !== "argon2id" ||
        parts[1] !== String(PARAMS.t) ||
        parts[2] !== String(PARAMS.m) ||
        parts[3] !== String(PARAMS.p) ||
        !/^[0-9a-f]{32}$/.test(parts[4]) ||
        !/^[0-9a-f]{64}$/.test(parts[5])) {
        return false;
    }

    if (Buffer.byteLength(password, "utf8") > 1024) {
        return false;
    }

    const salt = Buffer.from(parts[4], "hex");
    const expected = Buffer.from(parts[5], "hex");

    const actual = Buffer.from(
        argon2id(Buffer.from(password, "utf8"), salt, PARAMS)
    );

    return timingSafeEqual(actual, expected);
}

module.exports = { hashPassword, verifyPassword };
