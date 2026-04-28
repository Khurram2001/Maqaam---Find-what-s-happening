const prisma = require("../lib/prisma");
const { verifyAccessToken, readAccessTokenFromRequest } = require("../utils/auth");

async function requireAuth(req, _res, next) {
  try {
    const accessToken = readAccessTokenFromRequest(req);
    if (!accessToken) {
      const err = new Error("Authentication required");
      err.status = 401;
      err.code = "UNAUTHENTICATED";
      throw err;
    }

    const payload = verifyAccessToken(accessToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        emailVerifiedAt: true,
      },
    });

    if (!user || !user.isActive) {
      const err = new Error("User is inactive or does not exist");
      err.status = 401;
      err.code = "UNAUTHENTICATED";
      throw err;
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.code && error.status) {
      return next(error);
    }
    const err = new Error("Invalid or expired access token");
    err.status = 401;
    err.code = "UNAUTHENTICATED";
    return next(err);
  }
}

function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    const err = new Error("Admin access required");
    err.status = 403;
    err.code = "FORBIDDEN";
    return next(err);
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
