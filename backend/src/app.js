const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const routes = require("./routes");
const { corsOrigins, isProduction } = require("./config/env");
const { apiRateLimiter } = require("./middleware/rate-limit.middleware");

const app = express();

const trustProxy = String(process.env.TRUST_PROXY || "").toLowerCase();
if (trustProxy === "true" || trustProxy === "1") {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use("/api", apiRateLimiter, routes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: isProduction()
        ? "Route not found"
        : `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
});

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const isProd = isProduction();
  const message =
    isProd && status >= 500
      ? "Unexpected server error"
      : err.message || "Unexpected server error";
  const details =
    err.details && (status < 500 || !isProd) ? err.details : undefined;

  return res.status(status).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message,
      details,
    },
  });
});

module.exports = app;
