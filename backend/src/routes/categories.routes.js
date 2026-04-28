const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { requireAuth, requireAdmin } = require("../middleware/auth.middleware");

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

function validationError(zodError) {
  const err = new Error("Invalid request body");
  err.status = 400;
  err.code = "VALIDATION_ERROR";
  err.details = zodError.flatten();
  return err;
}

function conflictError(message) {
  const err = new Error(message);
  err.status = 409;
  err.code = "CONFLICT";
  return err;
}

categoriesRouter.get("/", async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
    });

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

module.exports = categoriesRouter;
