const { Resend } = require("resend");
const { escapeHtml } = require("../utils/security");

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    const err = new Error("RESEND_API_KEY is not configured");
    err.status = 500;
    err.code = "EMAIL_PROVIDER_NOT_CONFIGURED";
    throw err;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

async function sendVerificationEmail({ to, name, verifyUrl, idempotencyKey }) {
  const resend = getResendClient();
  const greeting = name ? `Hello ${escapeHtml(name)},` : "Hello,";
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: [to],
    subject: "Verify your Maqaam email",
    html: `<p>${greeting}</p><p>Welcome to Maqaam. Confirm your email address to activate your account and start organizing community gatherings.</p><p><a href="${verifyUrl}" style="display:inline-block;padding:12px 20px;background:#0B4D53;color:#FAF6F0;text-decoration:none;border-radius:8px;font-weight:600;">Verify email</a></p><p>If you did not create an account, you can ignore this email.</p><p style="word-break:break-all;color:#666;font-size:12px;">${verifyUrl}</p>`,
    idempotencyKey,
  });

  if (error) {
    const err = new Error(error.message || "Failed to send verification email");
    err.status = 502;
    err.code = "EMAIL_SEND_FAILED";
    throw err;
  }

  return data;
}

async function sendPasswordResetEmail({ to, name, resetUrl, idempotencyKey }) {
  const resend = getResendClient();
  const greeting = name ? `Hello ${escapeHtml(name)},` : "Hello,";
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: [to],
    subject: "Reset your Maqaam password",
    html: `<p>${greeting}</p><p>We received a request to reset your password. Click the button below to choose a new one. This link expires in 30 minutes.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#0B4D53;color:#FAF6F0;text-decoration:none;border-radius:8px;font-weight:600;">Reset password</a></p><p>If you did not request this, you can ignore this email.</p><p style="word-break:break-all;color:#666;font-size:12px;">${resetUrl}</p>`,
    idempotencyKey,
  });

  if (error) {
    const err = new Error(error.message || "Failed to send reset email");
    err.status = 502;
    err.code = "EMAIL_SEND_FAILED";
    throw err;
  }

  return data;
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
