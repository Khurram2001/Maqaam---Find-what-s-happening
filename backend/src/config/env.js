const requiredEnv = ["DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

const WEAK_SECRET_MARKERS = ["replace_with_strong_secret", "changeme", "your_"];

function isProduction() {
  return (process.env.NODE_ENV || "development") === "production";
}

function assertStrongSecret(name, value) {
  if (!value || value.length < 32) {
    throw new Error(`${name} must be at least 32 characters in production`);
  }
  const lower = value.toLowerCase();
  if (WEAK_SECRET_MARKERS.some((marker) => lower.includes(marker))) {
    throw new Error(`${name} must not use placeholder or weak values in production`);
  }
}

function assertEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  if (!isProduction()) {
    return;
  }

  assertStrongSecret("JWT_ACCESS_SECRET", process.env.JWT_ACCESS_SECRET);
  assertStrongSecret("JWT_REFRESH_SECRET", process.env.JWT_REFRESH_SECRET);

  const cookieSecure = String(process.env.COOKIE_SECURE || "false").toLowerCase() === "true";
  if (!cookieSecure) {
    throw new Error("COOKIE_SECURE must be true in production");
  }

  const productionRequired = [
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "FRONTEND_USER_BASE_URL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "CORS_ORIGIN_USER",
    "CORS_ORIGIN_ADMIN",
  ];

  const missingProd = productionRequired.filter((key) => !process.env[key]);
  if (missingProd.length > 0) {
    throw new Error(`Missing production env vars: ${missingProd.join(", ")}`);
  }

  if (!process.env.FRONTEND_USER_BASE_URL.startsWith("https://")) {
    throw new Error("FRONTEND_USER_BASE_URL must use HTTPS in production");
  }
}

module.exports = {
  assertEnv,
  isProduction,
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  cookieDomain: process.env.COOKIE_DOMAIN || "localhost",
  cookieSecure: String(process.env.COOKIE_SECURE || "false").toLowerCase() === "true",
  frontendUserBaseUrl: process.env.FRONTEND_USER_BASE_URL || "http://localhost:3000",
  emailVerifyTokenTtlMinutes: Number(process.env.EMAIL_VERIFY_TOKEN_TTL_MINUTES || 60),
  passwordResetTokenTtlMinutes: Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 30),
  corsOrigins: [
    process.env.CORS_ORIGIN_USER || "http://localhost:3000",
    process.env.CORS_ORIGIN_ADMIN || "http://localhost:3001",
  ],
};
