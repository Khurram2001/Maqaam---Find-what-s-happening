const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const prisma = require("../src/lib/prisma");
const { generateTokenPair } = require("../src/utils/token");

const base = "http://localhost:5000/api";
const now = Date.now();
const user = {
  name: "User Smoke",
  email: `user${now}@test.com`,
  phoneNumber: `+1555${String(now).slice(-10)}`,
  password: "Pass12345!",
};
const admin = {
  name: "Admin Smoke",
  email: `admin${now}@test.com`,
  phoneNumber: `+1666${String(now).slice(-10)}`,
  password: "Pass12345!",
};

const cookieJar = {
  user: "",
  admin: "",
};

async function req(method, path, body, who) {
  const options = {
    method,
    headers: {
      "content-type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  if (who && cookieJar[who]) {
    options.headers.cookie = cookieJar[who];
  }

  const response = await fetch(`${base}${path}`, options);
  const setCookies = response.headers.getSetCookie?.() || [];
  const fallbackSetCookie = response.headers.get("set-cookie");
  const allSetCookies = setCookies.length
    ? setCookies
    : fallbackSetCookie
      ? [fallbackSetCookie]
      : [];
  if (who && allSetCookies.length > 0) {
    cookieJar[who] = allSetCookies.map((cookie) => cookie.split(";")[0]).join("; ");
  }

  let json = null;
  try {
    json = await response.json();
  } catch (_error) {
    // ignore non-json responses for smoke output
  }

  return { status: response.status, json };
}

async function main() {
  const out = {};
  out.health = await req("GET", "/health");
  out.userRegister = await req("POST", "/auth/register", user, "user");
  out.adminRegister = await req("POST", "/auth/register", admin, "admin");

  if (out.userRegister.status === 201) {
    out.loginBeforeVerify = await req("POST", "/auth/login", {
      email: user.email,
      password: user.password,
    });
    out.verifyEmailRequest = await req("POST", "/auth/verify-email/request", {
      email: user.email,
    });

    const verifyUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true },
    });
    const { rawToken: verifyRawToken, tokenHash: verifyTokenHash } = generateTokenPair();
    await prisma.verificationToken.create({
      data: {
        userId: verifyUser.id,
        tokenHash: verifyTokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    out.verifyEmailConfirm = await req("POST", "/auth/verify-email/confirm", {
      token: verifyRawToken,
    });
    out.loginAfterVerify = await req(
      "POST",
      "/auth/login",
      { email: user.email, password: user.password },
      "user"
    );
  }

  // Registration can fail in local/dev when email provider credentials are missing.
  // Fallback user seeding keeps smoke coverage for the remaining protected APIs.
  if (out.userRegister.status !== 201) {
    await prisma.user.upsert({
      where: { email: user.email },
      create: {
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        passwordHash: await bcrypt.hash(user.password, 12),
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
      update: {
        phoneNumber: user.phoneNumber,
        passwordHash: await bcrypt.hash(user.password, 12),
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
  }
  if (out.adminRegister.status !== 201) {
    await prisma.user.upsert({
      where: { email: admin.email },
      create: {
        name: admin.name,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
        passwordHash: await bcrypt.hash(admin.password, 12),
        role: "ADMIN",
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
      update: {
        phoneNumber: admin.phoneNumber,
        passwordHash: await bcrypt.hash(admin.password, 12),
        role: "ADMIN",
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
  }

  await prisma.user.update({
    where: { email: user.email },
    data: { isEmailVerified: true, emailVerifiedAt: new Date() },
  });

  await prisma.user.update({
    where: { email: admin.email },
    data: { role: "ADMIN", isEmailVerified: true, emailVerifiedAt: new Date() },
  });

  out.userLogin = await req("POST", "/auth/login", { email: user.email, password: user.password }, "user");
  out.adminLogin = await req("POST", "/auth/login", { email: admin.email, password: admin.password }, "admin");

  out.forgotPassword = await req("POST", "/auth/forgot-password", { email: user.email });

  const resetPassword = "ResetPass789!";
  const dbUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } });
  const { rawToken, tokenHash } = generateTokenPair();
  await prisma.passwordResetToken.create({
    data: {
      userId: dbUser.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });
  out.resetPassword = await req("POST", "/auth/reset-password", {
    token: rawToken,
    newPassword: resetPassword,
  });
  out.loginAfterReset = await req(
    "POST",
    "/auth/login",
    { email: user.email, password: resetPassword },
    "user"
  );
  user.password = resetPassword;

  out.createCategory = await req(
    "POST",
    "/categories",
    { name: `Community ${now}`, slug: `community-${now}` },
    "admin"
  );

  out.createEvent = await req(
    "POST",
    "/events",
    {
      title: `Smoke Event ${now}`,
      description: "Annual Eid al-Adha community gathering and luncheon for families.",
      categoryId: out.createCategory.json?.data?.category?.id,
      addressLine: "Street 1",
      formattedAddress: "Street 1, City",
      providerPlaceId: "test-place",
      latitude: 24.8607,
      longitude: 67.0011,
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    },
    "user"
  );

  const eventId = out.createEvent.json?.data?.event?.id;
  out.pending = await req("GET", "/admin/events/pending", null, "admin");
  out.approve = await req("PATCH", `/admin/events/${eventId}/approve`, {}, "admin");
  out.publicEvents = await req("GET", "/events");

  const summary = {
    checks: {
      health: out.health.status,
      registerUser: out.userRegister.status,
      registerAdmin: out.adminRegister.status,
      loginBeforeVerify: out.loginBeforeVerify?.status,
      verifyEmailRequest: out.verifyEmailRequest?.status,
      verifyEmailConfirm: out.verifyEmailConfirm?.status,
      loginAfterVerify: out.loginAfterVerify?.status,
      loginUser: out.userLogin.status,
      loginAdmin: out.adminLogin.status,
      forgotPassword: out.forgotPassword.status,
      resetPassword: out.resetPassword.status,
      loginAfterReset: out.loginAfterReset.status,
      createCategory: out.createCategory.status,
      createEvent: out.createEvent.status,
      pending: out.pending.status,
      approve: out.approve.status,
      publicEvents: out.publicEvents.status,
    },
    eventId,
    publicCount: out.publicEvents.json?.data?.pagination?.total,
    approvedStatus: out.approve.json?.data?.event?.status,
    notes: {
      registerFallbackUsed: out.userRegister.status !== 201 || out.adminRegister.status !== 201,
    },
    errors: {
      userRegister: out.userRegister.json?.error,
      adminRegister: out.adminRegister.json?.error,
      loginBeforeVerify: out.loginBeforeVerify?.json?.error,
      verifyEmailRequest: out.verifyEmailRequest?.json?.error,
      verifyEmailConfirm: out.verifyEmailConfirm?.json?.error,
      loginAfterVerify: out.loginAfterVerify?.json?.error,
      userLogin: out.userLogin.json?.error,
      adminLogin: out.adminLogin.json?.error,
      forgotPassword: out.forgotPassword.json?.error,
      resetPassword: out.resetPassword.json?.error,
      loginAfterReset: out.loginAfterReset.json?.error,
      createCategory: out.createCategory.json?.error,
      createEvent: out.createEvent.json?.error,
      pending: out.pending.json?.error,
      approve: out.approve.json?.error,
      publicEvents: out.publicEvents.json?.error,
    },
  };

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
