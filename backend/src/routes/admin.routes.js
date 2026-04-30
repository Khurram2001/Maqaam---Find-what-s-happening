const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { requireAuth, requireAdmin } = require("../middleware/auth.middleware");
const { writeAuditLog } = require("../utils/audit");

const adminRouter = express.Router();

adminRouter.use(requireAuth, requireAdmin);

const rejectSchema = z.object({
  rejectionReason: z.string().trim().min(3).max(500),
});

const auditQuerySchema = z.object({
  actorUserId: z.string().uuid().optional(),
  targetType: z.string().trim().min(1).max(100).optional(),
  targetId: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const adminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

function notFoundError(message) {
  const err = new Error(message || "Not found");
  err.status = 404;
  err.code = "NOT_FOUND";
  return err;
}

function validationError(zodError) {
  const err = new Error("Invalid request body");
  err.status = 400;
  err.code = "VALIDATION_ERROR";
  err.details = zodError.flatten();
  return err;
}

adminRouter.get("/events/pending", async (req, res, next) => {
  try {
    const parsed = adminListQuerySchema.safeParse(req.query);
    if (!parsed.success) throw validationError(parsed.error);

    const page = parsed.data.page;
    const limit = parsed.data.limit;
    const where = { status: "PENDING", deletedAt: null };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          status: true,
          createdAt: true,
          startDate: true,
          endDate: true,
          formattedAddress: true,
          user: {
            select: { id: true, name: true, email: true },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/events/:id/approve", async (req, res, next) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, deletedAt: null },
      select: { id: true },
    });
    if (!event) throw notFoundError("Event not found");

    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        status: "APPROVED",
        rejectionReason: null,
        approvedBy: req.user.id,
        approvedAt: new Date(),
        rejectedBy: null,
        rejectedAt: null,
      },
      select: {
        id: true,
        status: true,
        approvedBy: true,
        approvedAt: true,
        rejectionReason: true,
      },
    });

    await writeAuditLog({
      actorUserId: req.user.id,
      action: "ADMIN_EVENT_APPROVE",
      targetType: "EVENT",
      targetId: updated.id,
      meta: { status: updated.status },
    });

    return res.status(200).json({
      success: true,
      data: { event: updated },
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/events/:id/reject", async (req, res, next) => {
  try {
    const parsed = rejectSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);

    const event = await prisma.event.findFirst({
      where: { id: req.params.id, deletedAt: null },
      select: { id: true },
    });
    if (!event) throw notFoundError("Event not found");

    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        status: "REJECTED",
        rejectionReason: parsed.data.rejectionReason,
        rejectedBy: req.user.id,
        rejectedAt: new Date(),
        approvedBy: null,
        approvedAt: null,
      },
      select: {
        id: true,
        status: true,
        rejectedBy: true,
        rejectedAt: true,
        rejectionReason: true,
      },
    });

    await writeAuditLog({
      actorUserId: req.user.id,
      action: "ADMIN_EVENT_REJECT",
      targetType: "EVENT",
      targetId: updated.id,
      meta: { rejectionReason: updated.rejectionReason },
    });

    return res.status(200).json({
      success: true,
      data: { event: updated },
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/users", async (req, res, next) => {
  try {
    const parsed = adminListQuerySchema.safeParse(req.query);
    if (!parsed.success) throw validationError(parsed.error);

    const page = parsed.data.page;
    const limit = parsed.data.limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.user.count(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/users/:id/promote", async (req, res, next) => {
  try {
    const existing = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!existing) throw notFoundError("User not found");

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN" },
      select: { id: true, role: true, isActive: true },
    });

    await writeAuditLog({
      actorUserId: req.user.id,
      action: "ADMIN_USER_PROMOTE",
      targetType: "USER",
      targetId: user.id,
      meta: { role: user.role },
    });

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/users/:id/deactivate", async (req, res, next) => {
  try {
    const existing = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!existing) throw notFoundError("User not found");

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: { isActive: false },
      select: { id: true, role: true, isActive: true },
    });

    await writeAuditLog({
      actorUserId: req.user.id,
      action: "ADMIN_USER_DEACTIVATE",
      targetType: "USER",
      targetId: user.id,
      meta: { isActive: user.isActive },
    });

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete("/users/:id", async (req, res, next) => {
  try {
    const existing = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!existing) throw notFoundError("User not found");

    await prisma.user.delete({ where: { id: existing.id } });

    await writeAuditLog({
      actorUserId: req.user.id,
      action: "ADMIN_USER_DELETE",
      targetType: "USER",
      targetId: existing.id,
    });

    return res.status(200).json({
      success: true,
      data: { message: "User deleted successfully" },
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/audit-logs", async (req, res, next) => {
  try {
    const parsed = auditQuerySchema.safeParse(req.query);
    if (!parsed.success) throw validationError(parsed.error);

    const where = {};
    if (parsed.data.actorUserId) where.actorUserId = parsed.data.actorUserId;
    if (parsed.data.targetType) where.targetType = parsed.data.targetType;
    if (parsed.data.targetId) where.targetId = parsed.data.targetId;

    const page = parsed.data.page;
    const limit = parsed.data.limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          actorUserId: true,
          action: true,
          targetType: true,
          targetId: true,
          meta: true,
          createdAt: true,
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = adminRouter;
