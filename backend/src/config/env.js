const requiredEnv = ["DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

function assertEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

module.exports = {
  assertEnv,
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
