const express = require("express");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth.middleware");
const {
  authRateLimiter,
  emailActionRateLimiter,
} = require("../middleware/rate-limit.middleware");
const { writeAuditLog } = require("../utils/audit");
const { generateTokenPair, hashRawToken } = require("../utils/token");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../services/email.service");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshExpiresAt,
  setAuthCookies,
  clearAuthCookies,
  readRefreshTokenFromRequest,
} = require("../utils/auth");
const {
  frontendUserBaseUrl,
  emailVerifyTokenTtlMinutes,
  passwordResetTokenTtlMinutes,
} = require("../config/env");

const authRouter = express.Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const verifyEmailRequestSchema = z.object({
  email: z.string().trim().email(),
});

const verifyEmailConfirmSchema = z.object({
  token: z.string().trim().min(10),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(10),
  newPassword: z.string().min(8).max(128),
});

function validationError(zodError) {
  const err = new Error("Invalid request body");
  err.status = 400;
  err.code = "VALIDATION_ERROR";
  err.details = zodError.flatten();
  return err;
}

function conflictError(message) {
  const err = new Error(message);
  err.status = 409;
  err.code = "CONFLICT";
  return err;
}

function unauthenticatedError(message) {
  const err = new Error(message || "Unauthenticated");
  err.status = 401;
  err.code = "UNAUTHENTICATED";
  return err;
}

function forbiddenError(message) {
  const err = new Error(message || "Forbidden");
  err.status = 403;
  err.code = "FORBIDDEN";
  return err;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
  };
}

function minutesFromNow(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

async function issueSession(res, req, userId) {
  const accessToken = signAccessToken({ userId });
  const refreshToken = signRefreshToken({ userId });

  await prisma.authSession.create({
    data: {
      userId,
      refreshTokenHash: hashRawToken(refreshToken),
      expiresAt: refreshExpiresAt(),
      userAgent: req.get("user-agent") || null,
      ipAddress: req.ip || null,
    },
  });

  setAuthCookies(res, { accessToken, refreshToken });
}

async function issueEmailVerification({ userId, email, name }) {
  await prisma.verificationToken.updateMany({
    where: {
      userId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { usedAt: new Date() },
  });

  const { rawToken, tokenHash } = generateTokenPair();
  const tokenRow = await prisma.verificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: minutesFromNow(emailVerifyTokenTtlMinutes),
    },
    select: { id: true },
  });

  const verifyUrl = `${frontendUserBaseUrl}/verify-email?token=${rawToken}`;
  await sendVerificationEmail({
    to: email,
    name,
    verifyUrl,
    idempotencyKey: `verify-email/${userId}/${tokenRow.id}`,
  });
}

async function issuePasswordReset({ userId, email, name }) {
  await prisma.passwordResetToken.updateMany({
    where: {
      userId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { usedAt: new Date() },
  });

  const { rawToken, tokenHash } = generateTokenPair();
  const tokenRow = await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: minutesFromNow(passwordResetTokenTtlMinutes),
    },
    select: { id: true },
  });

  const resetUrl = `${frontendUserBaseUrl}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail({
    to: email,
    name,
    resetUrl,
    idempotencyKey: `reset-password/${userId}/${tokenRow.id}`,
  });
}

authRouter.post("/register", authRateLimiter, async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const createdUser = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        passwordHash,
        isEmailVerified: false,
      },
    });

    await issueEmailVerification({
      userId: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
    });
    await writeAuditLog({
      actorUserId: createdUser.id,
      action: "AUTH_REGISTER",
      targetType: "USER",
      targetId: createdUser.id,
    });

    return res.status(201).json({
      success: true,
      data: {
        user: sanitizeUser(createdUser),
        emailVerificationRequired: true,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return next(conflictError("Email already in use"));
    }
    return next(error);
  }
});

authRouter.post("/login", authRateLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw unauthenticatedError("Invalid email or password");
    }

    if (!user.isEmailVerified) {
      throw forbiddenError("Email verification is required before login");
    }

    const matched = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!matched) {
      throw unauthenticatedError("Invalid email or password");
    }

    await issueSession(res, req, user.id);
    await writeAuditLog({
      actorUserId: user.id,
      action: "AUTH_LOGIN",
      targetType: "USER",
      targetId: user.id,
    });

    return res.status(200).json({
      success: true,
      data: { user: sanitizeUser(user) },
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/refresh", authRateLimiter, async (req, res, next) => {
  try {
    const refreshToken = readRefreshTokenFromRequest(req);
    if (!refreshToken) {
      throw unauthenticatedError("Refresh token not found");
    }

    const payload = verifyRefreshToken(refreshToken);
    const refreshTokenHash = hashRawToken(refreshToken);

    const existingSession = await prisma.authSession.findFirst({
      where: {
        userId: payload.userId,
        refreshTokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!existingSession) {
      throw unauthenticatedError("Refresh session is invalid");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user || !user.isActive) {
      throw unauthenticatedError("User is inactive or does not exist");
    }
    if (!user.isEmailVerified) {
      throw forbiddenError("Email verification is required before refresh");
    }

    const nextAccessToken = signAccessToken({ userId: user.id });
    const nextRefreshToken = signRefreshToken({ userId: user.id });

    await prisma.authSession.update({
      where: { id: existingSession.id },
      data: {
        refreshTokenHash: hashRawToken(nextRefreshToken),
        expiresAt: refreshExpiresAt(),
      },
    });

    setAuthCookies(res, {
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
    });

    return res.status(200).json({
      success: true,
      data: { user: sanitizeUser(user) },
    });
  } catch (error) {
    if (error.code && error.status) {
      return next(error);
    }
    return next(error);
  }
});

authRouter.post("/logout", authRateLimiter, async (req, res, next) => {
  try {
    const refreshToken = readRefreshTokenFromRequest(req);
    if (refreshToken) {
      const refreshTokenHash = hashRawToken(refreshToken);
      await prisma.authSession.updateMany({
        where: {
          refreshTokenHash,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }

    clearAuthCookies(res);
    try {
      if (refreshToken) {
        const payload = verifyRefreshToken(refreshToken);
        await writeAuditLog({
          actorUserId: payload.userId,
          action: "AUTH_LOGOUT",
          targetType: "USER",
          targetId: payload.userId,
        });
      }
    } catch (_error) {
      // Logout should still succeed even if token cannot be decoded for audit.
    }
    return res.status(200).json({
      success: true,
      data: { message: "Logged out successfully" },
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/verify-email/request", emailActionRateLimiter, async (req, res, next) => {
  try {
    const parsed = verifyEmailRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: { id: true, email: true, name: true, isActive: true, isEmailVerified: true },
    });

    if (user && user.isActive && !user.isEmailVerified) {
      await issueEmailVerification({
        userId: user.id,
        email: user.email,
        name: user.name,
      });
      await writeAuditLog({
        actorUserId: user.id,
        action: "AUTH_VERIFY_EMAIL_REQUEST",
        targetType: "USER",
        targetId: user.id,
      });
    }

    return res.status(200).json({
      success: true,
      data: { message: "If your account exists, a verification email has been sent." },
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/verify-email/confirm", emailActionRateLimiter, async (req, res, next) => {
  try {
    const parsed = verifyEmailConfirmSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const tokenHash = hashRawToken(parsed.data.token);
    const token = await prisma.verificationToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, userId: true },
    });

    if (!token) {
      throw forbiddenError("Invalid or expired verification token");
    }

    const user = await prisma.user.update({
      where: { id: token.userId },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    await prisma.verificationToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "AUTH_VERIFY_EMAIL_SUCCESS",
      targetType: "USER",
      targetId: user.id,
    });

    return res.status(200).json({
      success: true,
      data: { user: sanitizeUser(user) },
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/forgot-password", emailActionRateLimiter, async (req, res, next) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: { id: true, email: true, name: true, isActive: true },
    });

    if (user && user.isActive) {
      await issuePasswordReset({
        userId: user.id,
        email: user.email,
        name: user.name,
      });
      await writeAuditLog({
        actorUserId: user.id,
        action: "AUTH_FORGOT_PASSWORD_REQUEST",
        targetType: "USER",
        targetId: user.id,
      });
    }

    return res.status(200).json({
      success: true,
      data: { message: "If your account exists, a reset email has been sent." },
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/reset-password", emailActionRateLimiter, async (req, res, next) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const tokenHash = hashRawToken(parsed.data.token);
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, userId: true },
    });

    if (!resetToken) {
      throw forbiddenError("Invalid or expired password reset token");
    }

    const nextHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: nextHash },
    });

    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    await prisma.authSession.updateMany({
      where: {
        userId: resetToken.userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    await writeAuditLog({
      actorUserId: resetToken.userId,
      action: "AUTH_RESET_PASSWORD_SUCCESS",
      targetType: "USER",
      targetId: resetToken.userId,
    });

    return res.status(200).json({
      success: true,
      data: { message: "Password has been reset successfully" },
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  return res.status(200).json({
    success: true,
    data: { user: req.user },
  });
});

module.exports = authRouter;
