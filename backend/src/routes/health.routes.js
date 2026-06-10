const express = require("express");
const prisma = require("../lib/prisma");

const healthRouter = express.Router();

healthRouter.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      success: true,
      data: {
        service: "Maqaam backend",
        status: "ok",
        database: "ok",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (_error) {
    return res.status(503).json({
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Database health check failed",
      },
    });
  }
});

module.exports = healthRouter;
