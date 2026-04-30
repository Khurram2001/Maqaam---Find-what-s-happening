const express = require("express");
const { z } = require("zod");
const { v2: cloudinary } = require("cloudinary");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth.middleware");
const { readAccessTokenFromRequest, verifyAccessToken } = require("../utils/auth");
const { writeAuditLog } = require("../utils/audit");

const eventsRouter = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const querySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  category: z.string().trim().optional(),
  startDateFrom: z.coerce.date().optional(),
  startDateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

const eventBodySchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10),
    imageUrl: z.string().url().optional().or(z.literal("")).transform((v) => v || null),
    categoryId: z.string().uuid().optional().or(z.literal("")).transform((v) => v || null),
    addressLine: z.string().trim().optional().or(z.literal("")).transform((v) => v || null),
    formattedAddress: z.string().trim().optional().or(z.literal("")).transform((v) => v || null),
    providerPlaceId: z.string().trim().optional().or(z.literal("")).transform((v) => v || null),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .superRefine((value, ctx) => {
    if (value.endDate <= value.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "endDate must be later than startDate",
      });
    }
  });

function validationError(zodError) {
  const err = new Error("Invalid request data");
  err.status = 400;
  err.code = "VALIDATION_ERROR";
  err.details = zodError.flatten();
  return err;
}

function forbiddenError(message) {
  const err = new Error(message || "Forbidden");
  err.status = 403;
  err.code = "FORBIDDEN";
  return err;
}

function notFoundError(message) {
  const err = new Error(message || "Not found");
  err.status = 404;
  err.code = "NOT_FOUND";
  return err;
}

async function resolveOptionalUser(req) {
  try {
    // Optional auth: used on public routes to widen visibility for owner/admin.
    const token = readAccessTokenFromRequest(req);
    if (!token) return null;
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isActive: true },
    });
    return user && user.isActive ? user : null;
  } catch (_error) {
    return null;
  }
}

function eventSelect() {
  return {
    id: true,
    userId: true,
    categoryId: true,
    title: true,
    description: true,
    imageUrl: true,
    addressLine: true,
    formattedAddress: true,
    providerPlaceId: true,
    latitude: true,
    longitude: true,
    startDate: true,
    endDate: true,
    status: true,
    rejectionReason: true,
    approvedBy: true,
    approvedAt: true,
    rejectedBy: true,
    rejectedAt: true,
    createdAt: true,
    updatedAt: true,
    category: { select: { id: true, name: true, slug: true } },
  };
}

eventsRouter.get("/", async (req, res, next) => {
  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) throw validationError(parsed.error);

    const currentUser = await resolveOptionalUser(req);
    const isAdmin = currentUser?.role === "ADMIN";
    const where = { deletedAt: null };

    if (parsed.data.q) {
      where.OR = [
        { title: { contains: parsed.data.q, mode: "insensitive" } },
        { description: { contains: parsed.data.q, mode: "insensitive" } },
      ];
    }
    if (parsed.data.category) where.categoryId = parsed.data.category;
    if (parsed.data.startDateFrom || parsed.data.startDateTo) {
      where.startDate = {};
      if (parsed.data.startDateFrom) where.startDate.gte = parsed.data.startDateFrom;
      if (parsed.data.startDateTo) where.startDate.lte = parsed.data.startDateTo;
    }
    if (parsed.data.status) {
      where.status = isAdmin ? parsed.data.status : "APPROVED";
    } else if (!isAdmin) {
      where.status = "APPROVED";
    }

    const page = parsed.data.page;
    const limit = parsed.data.limit;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { startDate: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        select: eventSelect(),
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

eventsRouter.get("/my/list", requireAuth, async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: { userId: req.user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: eventSelect(),
    });

    return res.status(200).json({
      success: true,
      data: { events },
    });
  } catch (error) {
    return next(error);
  }
});

eventsRouter.get("/:id", async (req, res, next) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, deletedAt: null },
      select: eventSelect(),
    });
    if (!event) throw notFoundError("Event not found");

    const currentUser = await resolveOptionalUser(req);
    const isOwner = currentUser?.id === event.userId;
    const isAdmin = currentUser?.role === "ADMIN";
    if (event.status !== "APPROVED" && !isOwner && !isAdmin) {
      throw forbiddenError("You are not allowed to view this event");
    }

    return res.status(200).json({
      success: true,
      data: { event },
    });
  } catch (error) {
    return next(error);
  }
});

eventsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const parsed = eventBodySchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);

    const event = await prisma.event.create({
      data: {
        ...parsed.data,
        userId: req.user.id,
        status: "PENDING",
      },
      select: eventSelect(),
    });

    await writeAuditLog({
      actorUserId: req.user.id,
      action: "EVENT_CREATE",
      targetType: "EVENT",
      targetId: event.id,
      meta: { status: event.status },
    });

    return res.status(201).json({
      success: true,
      data: { event },
    });
  } catch (error) {
    return next(error);
  }
});

eventsRouter.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const parsed = eventBodySchema.partial().safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);
    if (Object.keys(parsed.data).length === 0) {
      const err = new Error("At least one field is required for update");
      err.status = 400;
      err.code = "VALIDATION_ERROR";
      throw err;
    }

    const existing = await prisma.event.findFirst({
      where: { id: req.params.id, deletedAt: null },
      select: { id: true, userId: true, startDate: true, endDate: true },
    });
    if (!existing) throw notFoundError("Event not found");

    const isOwner = existing.userId === req.user.id;
    const isAdmin = req.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      throw forbiddenError("Only owner or admin can update this event");
    }

    // Validate with merged values so partial updates cannot bypass date ordering.
    const nextStartDate = parsed.data.startDate || existing.startDate;
    const nextEndDate = parsed.data.endDate || existing.endDate;
    if (nextEndDate <= nextStartDate) {
      const err = new Error("endDate must be later than startDate");
      err.status = 400;
      err.code = "VALIDATION_ERROR";
      throw err;
    }

    const event = await prisma.event.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        // Owner edits re-enter moderation; admin edits preserve moderation state.
        status: isAdmin ? undefined : "PENDING",
        rejectionReason: isAdmin ? undefined : null,
      },
      select: eventSelect(),
    });

    await writeAuditLog({
      actorUserId: req.user.id,
      action: "EVENT_UPDATE",
      targetType: "EVENT",
      targetId: event.id,
      meta: { status: event.status },
    });

    return res.status(200).json({
      success: true,
      data: { event },
    });
  } catch (error) {
    return next(error);
  }
});

eventsRouter.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.event.findFirst({
      where: { id: req.params.id, deletedAt: null },
      select: { id: true, userId: true },
    });
    if (!existing) throw notFoundError("Event not found");

    const isOwner = existing.userId === req.user.id;
    const isAdmin = req.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      throw forbiddenError("Only owner or admin can delete this event");
    }

    await prisma.event.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
    });

    await writeAuditLog({
      actorUserId: req.user.id,
      action: "EVENT_DELETE_SOFT",
      targetType: "EVENT",
      targetId: existing.id,
    });

    return res.status(200).json({
      success: true,
      data: { message: "Event deleted successfully" },
    });
  } catch (error) {
    return next(error);
  }
});

eventsRouter.get("/:id/images", async (req, res, next) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, deletedAt: null },
      select: { id: true, userId: true, status: true },
    });
    if (!event) throw notFoundError("Event not found");

    const currentUser = await resolveOptionalUser(req);
    const isOwner = currentUser?.id === event.userId;
    const isAdmin = currentUser?.role === "ADMIN";
    if (event.status !== "APPROVED" && !isOwner && !isAdmin) {
      throw forbiddenError("You are not allowed to view images for this event");
    }

    const images = await prisma.eventImage.findMany({
      where: { eventId: event.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        eventId: true,
        url: true,
        publicId: true,
        sortOrder: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: { images },
    });
  } catch (error) {
    return next(error);
  }
});

eventsRouter.delete("/:id/images/:imageId", requireAuth, async (req, res, next) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, deletedAt: null },
      select: { id: true, userId: true },
    });
    if (!event) throw notFoundError("Event not found");

    const isOwner = event.userId === req.user.id;
    const isAdmin = req.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      throw forbiddenError("Only owner or admin can delete event images");
    }

    const image = await prisma.eventImage.findFirst({
      where: { id: req.params.imageId, eventId: event.id },
      select: { id: true, url: true, publicId: true },
    });
    if (!image) throw notFoundError("Event image not found");

    await prisma.eventImage.delete({ where: { id: image.id } });

    await writeAuditLog({
      actorUserId: req.user.id,
      action: "EVENT_IMAGE_DELETE",
      targetType: "EVENT_IMAGE",
      targetId: image.id,
      meta: { eventId: event.id },
    });

    if (image.publicId) {
      try {
        await cloudinary.uploader.destroy(image.publicId, { resource_type: "image" });
      } catch (_error) {
        // DB deletion should not fail if remote asset cleanup errors.
      }
    }

    const remainingImages = await prisma.eventImage.findMany({
      where: { eventId: event.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, url: true },
    });

    // Keep Event.imageUrl aligned with first remaining image after deletion.
    const nextPrimaryImageUrl = remainingImages[0]?.url || null;
    await prisma.event.update({
      where: { id: event.id },
      data: { imageUrl: nextPrimaryImageUrl },
    });

    return res.status(200).json({
      success: true,
      data: { message: "Event image deleted successfully" },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = eventsRouter;
