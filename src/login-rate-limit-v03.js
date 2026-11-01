"use strict";

const { rateLimit } = require("express-rate-limit");

function createV03LoginRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    message: {
      error: "Trop de tentatives de connexion. Reessayez plus tard."
    }
  });
}

module.exports = {
  createV03LoginRateLimiter
};
