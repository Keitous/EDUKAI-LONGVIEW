"use strict";

const path = require("path");

function getLongViewMcpServer(options = {}) {
  const mode = options.mode || "legacy";

  if (mode === "nairobi_v03") {
    if (
      !["nairobi_reset_test", "nairobi_cloud"].includes(
        process.env.EDUKAI_V03_MODE
      )
    ) {
      throw new Error(
        "Nairobi V0.3 : environnement non autorise."
      );
    }

    return path.resolve(__dirname, "mcp-server-v03.js");
  }

  if (mode === "legacy") {
    return path.resolve(__dirname, "mcp-server.js");
  }

  throw new Error("Mode MCP LongView non autorise.");
}

module.exports = {
  getLongViewMcpServer
};