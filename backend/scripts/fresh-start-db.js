/**
 * Fresh-start cleanup: keep exactly two accounts, remove all other data.
 * Usage: node backend/scripts/fresh-start-db.js
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const prisma = require("../src/lib/prisma");

const KEEP_ADMIN_EMAIL = "khurramzaman2001@gmail.com";
const KEEP_USER_EMAIL = "uw-21-cs-bsc-091@student.uow.edu.pk";

async function main() {
  const keepEmails = [KEEP_ADMIN_EMAIL, KEEP_USER_EMAIL];

  const keepUsers = await prisma.user.findMany({
    where: { email: { in: keepEmails } },
    select: { id: true, email: true, role: true },
  });

  const foundEmails = new Set(keepUsers.map((u) => u.email));
  const missing = keepEmails.filter((e) => !foundEmails.has(e));
  if (missing.length > 0) {
    throw new Error(
      `Cannot continue — register these accounts first, then re-run:\n  ${missing.join("\n  ")}`
    );
  }

  const keepIds = keepUsers.map((u) => u.id);
  const admin = keepUsers.find((u) => u.email === KEEP_ADMIN_EMAIL);
  const user = keepUsers.find((u) => u.email === KEEP_USER_EMAIL);

  const before = {
    users: await prisma.user.count(),
    events: await prisma.event.count(),
    categories: await prisma.category.count(),
    sessions: await prisma.authSession.count(),
    auditLogs: await prisma.auditLog.count(),
  };

  const result = await prisma.$transaction(async (tx) => {
    const deletedEventImages = await tx.eventImage.deleteMany({});
    const deletedEvents = await tx.event.deleteMany({});
    const deletedAuditLogs = await tx.auditLog.deleteMany({});
    const deletedSessions = await tx.authSession.deleteMany({});
    const deletedVerifyTokens = await tx.verificationToken.deleteMany({});
    const deletedResetTokens = await tx.passwordResetToken.deleteMany({});
    const deletedCategories = await tx.category.deleteMany({});
    const deletedUsers = await tx.user.deleteMany({
      where: { id: { notIn: keepIds } },
    });

    await tx.user.update({
      where: { id: admin.id },
      data: {
        role: "ADMIN",
        isActive: true,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        role: "USER",
        isActive: true,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    return {
      deletedEventImages: deletedEventImages.count,
      deletedEvents: deletedEvents.count,
      deletedAuditLogs: deletedAuditLogs.count,
      deletedSessions: deletedSessions.count,
      deletedVerifyTokens: deletedVerifyTokens.count,
      deletedResetTokens: deletedResetTokens.count,
      deletedCategories: deletedCategories.count,
      deletedUsers: deletedUsers.count,
    };
  });

  const after = {
    users: await prisma.user.count(),
    events: await prisma.event.count(),
    categories: await prisma.category.count(),
    sessions: await prisma.authSession.count(),
    auditLogs: await prisma.auditLog.count(),
  };

  const kept = await prisma.user.findMany({
    where: { id: { in: keepIds } },
    select: { email: true, role: true, isEmailVerified: true, isActive: true },
    orderBy: { email: "asc" },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        keptAccounts: kept,
        before,
        deleted: result,
        after,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
