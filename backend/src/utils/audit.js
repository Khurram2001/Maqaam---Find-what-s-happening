const prisma = require("../lib/prisma");

async function writeAuditLog({ actorUserId, action, targetType, targetId, meta }) {
  if (!actorUserId || !action || !targetType || !targetId) return;

  try {
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        targetType,
        targetId,
        meta: meta || null,
      },
    });
  } catch (_error) {
    // Audit logging should not break primary API flows.
  }
}

module.exports = { writeAuditLog };
