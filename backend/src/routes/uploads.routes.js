const express = require("express");
const multer = require("multer");
const { z } = require("zod");
const { v2: cloudinary } = require("cloudinary");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth.middleware");
const { uploadRateLimiter } = require("../middleware/rate-limit.middleware");

const uploadsRouter = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      const err = new Error("Only image uploads are allowed");
      err.status = 400;
      err.code = "VALIDATION_ERROR";
      return cb(err);
    }
    return cb(null, true);
  },
});

function uploadBufferToCloudinary(fileBuffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
}

const attachSchema = z.object({
  eventId: z.string().uuid().optional(),
});

uploadsRouter.post(
  "/event-image",
  requireAuth,
  uploadRateLimiter,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        const err = new Error("Image file is required");
        err.status = 400;
        err.code = "VALIDATION_ERROR";
        throw err;
      }

      const parsed = attachSchema.safeParse({
        eventId: req.body?.eventId || undefined,
      });
      if (!parsed.success) {
        const err = new Error("Invalid eventId");
        err.status = 400;
        err.code = "VALIDATION_ERROR";
        err.details = parsed.error.flatten();
        throw err;
      }

      let eventImage = null;
      let event = null;
      if (parsed.data.eventId) {
        event = await prisma.event.findFirst({
          where: { id: parsed.data.eventId, deletedAt: null },
          select: { id: true, userId: true, imageUrl: true },
        });
        if (!event) {
          const err = new Error("Event not found");
          err.status = 404;
          err.code = "NOT_FOUND";
          throw err;
        }

        const isOwner = event.userId === req.user.id;
        const isAdmin = req.user.role === "ADMIN";
        if (!isOwner && !isAdmin) {
          const err = new Error("Only owner or admin can attach images to this event");
          err.status = 403;
          err.code = "FORBIDDEN";
          throw err;
        }
      }

      const result = await uploadBufferToCloudinary(req.file.buffer, "mems/events");

      if (parsed.data.eventId) {
        const existingCount = await prisma.eventImage.count({
          where: { eventId: event.id },
        });

        eventImage = await prisma.eventImage.create({
          data: {
            eventId: event.id,
            url: result.secure_url,
            publicId: result.public_id,
            sortOrder: existingCount + 1,
          },
          select: {
            id: true,
            eventId: true,
            url: true,
            publicId: true,
            sortOrder: true,
            createdAt: true,
          },
        });

        if (!event.imageUrl) {
          await prisma.event.update({
            where: { id: event.id },
            data: { imageUrl: result.secure_url },
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          eventImage,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = uploadsRouter;
