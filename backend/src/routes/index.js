// When adding or changing routes, update Documentation.md (API sections)
const express = require("express");
const healthRouter = require("./health.routes");
const authRouter = require("./auth.routes");
const categoriesRouter = require("./categories.routes");
const eventsRouter = require("./events.routes");
const adminRouter = require("./admin.routes");
const uploadsRouter = require("./uploads.routes");
const { writeRateLimiter } = require("../middleware/rate-limit.middleware");

const router = express.Router();

function applyWriteRateLimitUnlessGet(req, res, next) {
  if (req.method === "GET") {
    return next();
  }
  return writeRateLimiter(req, res, next);
}

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/categories", applyWriteRateLimitUnlessGet, categoriesRouter);
router.use("/events", applyWriteRateLimitUnlessGet, eventsRouter);
router.use("/admin", applyWriteRateLimitUnlessGet, adminRouter);
router.use("/uploads", uploadsRouter);

module.exports = router;
