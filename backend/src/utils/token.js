const crypto = require("crypto");

function generateRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashRawToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function generateTokenPair() {
  const rawToken = generateRawToken();
  return {
    rawToken,
    tokenHash: hashRawToken(rawToken),
  };
}

module.exports = {
  generateTokenPair,
  hashRawToken,
};
