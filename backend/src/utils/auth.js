const jwt = require("jsonwebtoken");
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} = process.env;
const {
  accessTokenExpiresIn,
  refreshTokenExpiresIn,
  cookieDomain,
  cookieSecure,
} = require("../config/env");

const ACCESS_COOKIE_NAME = "mems_access_token";
const REFRESH_COOKIE_NAME = "mems_refresh_token";

function signAccessToken(payload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN || accessTokenExpiresIn,
    algorithm: "HS256",
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN || refreshTokenExpiresIn,
    algorithm: "HS256",
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, JWT_ACCESS_SECRET, { algorithms: ["HS256"] });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: ["HS256"] });
}

function refreshExpiresAt() {
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + sevenDaysMs);
}

function baseCookieOptions() {
  const options = {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSecure ? "none" : "lax",
    path: "/",
  };

  if (cookieDomain && cookieDomain !== "localhost") {
    options.domain = cookieDomain;
  }

  return options;
}

function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    ...baseCookieOptions(),
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...baseCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE_NAME, baseCookieOptions());
  res.clearCookie(REFRESH_COOKIE_NAME, baseCookieOptions());
}

function readAccessTokenFromRequest(req) {
  return req.cookies?.[ACCESS_COOKIE_NAME];
}

function readRefreshTokenFromRequest(req) {
  return req.cookies?.[REFRESH_COOKIE_NAME];
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshExpiresAt,
  setAuthCookies,
  clearAuthCookies,
  readAccessTokenFromRequest,
  readRefreshTokenFromRequest,
};
