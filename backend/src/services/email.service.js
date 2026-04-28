const { Resend } = require("resend");

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
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: [to],
    subject: "Verify your email address",
    html: `<p>Hello ${name || "there"},</p><p>Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
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
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: [to],
    subject: "Reset your password",
    html: `<p>Hello ${name || "there"},</p><p>You can reset your password using the link below:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
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
