const express = require("express");

const healthRouter = express.Router();

healthRouter.get("/", (_req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      service: "MEMS backend",
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = healthRouter;
