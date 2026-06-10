const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { cloudinary } = require("../lib/cloudinary");
const { requireAuth } = require("../middleware/auth.middleware");
const { readAccessTokenFromRequest, verifyAccessToken } = require("../utils/auth");
const { writeAuditLog } = require("../utils/audit");
const {
  validationError,
  forbiddenError,
  notFoundError,
  badRequestError,
} = require("../utils/http-errors");

const eventsRouter = express.Router();
const querySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  category: z.string().uuid().optional(),
  startDateFrom: z.coerce.date().optional(),
  startDateTo: z.coerce.date().optional(),
  schedule: z.enum(["past", "today", "upcoming"]).optional(),
  sort: z.enum(["default", "upcoming", "newest", "oldest"]).optional().default("default"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

function getDayBounds(reference = new Date()) {
  const startOfToday = new Date(reference);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(reference);
  endOfToday.setHours(23, 59, 59, 999);
  return { startOfToday, endOfToday };
}

const EVENT_DESCRIPTION_MAX_WORDS = 500;

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const eventBodySchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    description: z
      .string()
      .trim()
      .min(10)
      .refine((value) => countWords(value) <= EVENT_DESCRIPTION_MAX_WORDS, {
        message: `Description must be at most ${EVENT_DESCRIPTION_MAX_WORDS} words`,
      }),
    imageUrl: z.string().url().optional().or(z.literal("")).transform((v) => v || null),
    categoryId: z.string().uuid(),
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

async function resolveOptionalUser(req) {  try {
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

function eventSelect({ includeHost = false } = {}) {
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
    ...(includeHost
      ? {
          user: {
            select: { id: true, name: true, email: true },
          },
        }
      : {}),
  };
}

eventsRouter.get("/", async (req, res, next) => {
  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) throw validationError(parsed.error, "Invalid request data");
    const currentUser = await resolveOptionalUser(req);
    const isAdmin = currentUser?.role === "ADMIN";
    const where = { deletedAt: null };

    if (parsed.data.q) {
      where.OR = [
        { title: { contains: parsed.data.q, mode: "insensitive" } },
        { description: { contains: parsed.data.q, mode: "insensitive" } },
        { formattedAddress: { contains: parsed.data.q, mode: "insensitive" } },
        { addressLine: { contains: parsed.data.q, mode: "insensitive" } },
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

    if (isAdmin && parsed.data.schedule) {
      const { startOfToday, endOfToday } = getDayBounds();
      if (parsed.data.schedule === "past") {
        where.endDate = { lt: startOfToday };
      } else if (parsed.data.schedule === "today") {
        where.AND = [{ startDate: { lte: endOfToday } }, { endDate: { gte: startOfToday } }];
      } else if (parsed.data.schedule === "upcoming") {
        where.startDate = { gt: endOfToday };
      }
    }

    const page = parsed.data.page;
    const limit = parsed.data.limit;

    let orderBy =
      parsed.data.sort === "upcoming"
        ? { startDate: "asc" }
        : parsed.data.sort === "oldest"
          ? { createdAt: "asc" }
          : parsed.data.sort === "newest"
            ? { createdAt: "desc" }
            : { createdAt: "desc" };

    if (isAdmin && parsed.data.schedule === "past") {
      orderBy = { startDate: "desc" };
    } else if (isAdmin && (parsed.data.schedule === "today" || parsed.data.schedule === "upcoming")) {
      orderBy = { startDate: "asc" };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: eventSelect({ includeHost: isAdmin }),
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
    const currentUser = await resolveOptionalUser(req);
    const eventRecord = await prisma.event.findFirst({
      where: { id: req.params.id, deletedAt: null },
      select: { userId: true, status: true },
    });
    if (!eventRecord) throw notFoundError("Event not found");

    const isOwner = currentUser?.id === eventRecord.userId;
    const isAdmin = currentUser?.role === "ADMIN";
    if (eventRecord.status !== "APPROVED" && !isOwner && !isAdmin) {
      throw forbiddenError("You are not allowed to view this event");
    }

    const event = await prisma.event.findFirst({
      where: { id: req.params.id, deletedAt: null },
      select: eventSelect({ includeHost: isOwner || isAdmin }),
    });
    if (!event) throw notFoundError("Event not found");

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
    if (!parsed.success) throw validationError(parsed.error, "Invalid request data");
    if (Object.keys(parsed.data).length === 0) {
      throw badRequestError("At least one field is required for update");
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
      throw badRequestError("endDate must be later than startDate");
    }
    const event = await prisma.event.update({
      where: { id: existing.id },
      data: isAdmin
        ? { ...parsed.data }
        : {
            ...parsed.data,
            // Owner edits re-enter moderation; clear prior decision fields.
            status: "PENDING",
            rejectionReason: null,
            rejectedBy: null,
            rejectedAt: null,
            approvedBy: null,
            approvedAt: null,
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
