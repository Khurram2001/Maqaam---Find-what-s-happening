const express = require("express");
const healthRouter = require("./health.routes");
const authRouter = require("./auth.routes");
const categoriesRouter = require("./categories.routes");
const eventsRouter = require("./events.routes");
const adminRouter = require("./admin.routes");
const uploadsRouter = require("./uploads.routes");

const router = express.Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/categories", categoriesRouter);
router.use("/events", eventsRouter);
router.use("/admin", adminRouter);
router.use("/uploads", uploadsRouter);

module.exports = router;
