const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { requireAuth, requireAdmin } = require("../middleware/auth.middleware");
const { validationError, conflictError, notFoundError } = require("../utils/http-errors");

const categoriesRouter = express.Router();

const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "slug must contain lowercase letters, numbers, and hyphens"),
});

const updateCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .regex(/^[a-z0-9-]+$/, "slug must contain lowercase letters, numbers, and hyphens")
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.slug !== undefined, {
    message: "At least one of name or slug is required",
  });

const categoryIdSchema = z.object({
  id: z.string().uuid(),
});

categoriesRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { events: true } } },
    });

    const categories = rows.map(({ _count, ...category }) => ({
      ...category,
      eventCount: _count.events,
    }));

    return res.status(200).json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    return next(error);
  }
});

categoriesRouter.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const category = await prisma.category.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
      },
    });

    return res.status(201).json({
      success: true,
      data: { category },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return next(conflictError("Category name or slug already exists"));
    }
    return next(error);
  }
});

categoriesRouter.patch("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const idParsed = categoryIdSchema.safeParse({ id: req.params.id });
    if (!idParsed.success) {
      throw validationError(idParsed.error, "Invalid category id");
    }

    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const existing = await prisma.category.findUnique({
      where: { id: idParsed.data.id },
    });
    if (!existing) {
      return next(notFoundError("Category not found"));
    }

    const category = await prisma.category.update({
      where: { id: idParsed.data.id },
      data: parsed.data,
      include: { _count: { select: { events: true } } },
    });

    const { _count, ...rest } = category;
    return res.status(200).json({
      success: true,
      data: { category: { ...rest, eventCount: _count.events } },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return next(conflictError("Category name or slug already exists"));
    }
    return next(error);
  }
});

categoriesRouter.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const idParsed = categoryIdSchema.safeParse({ id: req.params.id });
    if (!idParsed.success) {
      throw validationError(idParsed.error, "Invalid category id");
    }

    const existing = await prisma.category.findUnique({
      where: { id: idParsed.data.id },
      include: { _count: { select: { events: true } } },
    });
    if (!existing) {
      return next(notFoundError("Category not found"));
    }

    if (existing._count.events > 0) {
      return next(
        conflictError(
          `Cannot delete category while ${existing._count.events} gathering(s) still use it`
        )
      );
    }

    await prisma.category.delete({ where: { id: idParsed.data.id } });

    return res.status(200).json({
      success: true,
      data: { deleted: true, id: idParsed.data.id },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = categoriesRouter;
