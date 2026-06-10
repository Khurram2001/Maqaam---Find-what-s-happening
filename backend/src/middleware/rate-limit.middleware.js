const rateLimit = require("express-rate-limit");

function rateLimitHandler(message) {
  return (_req, res) => {
    return res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message,
      },
    });
  };
}

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rateLimitHandler("Too many authentication attempts. Please try again later."),
});

const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rateLimitHandler("Too many upload requests. Please try again later."),
});

const emailActionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rateLimitHandler("Too many email verification/reset requests. Please try again later."),
});

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rateLimitHandler("Too many requests. Please try again later."),
});

const writeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rateLimitHandler("Too many write requests. Please try again later."),
});

module.exports = {
  authRateLimiter,
  uploadRateLimiter,
  emailActionRateLimiter,
  apiRateLimiter,
  writeRateLimiter,
};
