# Frontend Forms Contract

This file maps frontend form fields to the current backend API requirements.

Base URL: `/api`

## Global API Notes
- Send authenticated requests with cookies enabled (`credentials: include`).
- Success shape: `{ "success": true, "data": ... }`
- Error shape: `{ "success": false, "error": { "code": "...", "message": "...", "details": ... } }`

## User App Forms

### Register Form
Endpoint: `POST /auth/register`

Fields:
- `name` (string, required, min 2, max 120)
- `email` (string, required, valid email)
- `phoneNumber` (string, required, E.164: `^\+[1-9]\d{7,14}$`)
- `password` (string, required, min 8, max 128)

Expected response data:
- `user`: `{ id, name, email, phoneNumber, role, isActive, isEmailVerified, emailVerifiedAt, createdAt }`
- `emailVerificationRequired` (boolean)

### Login Form
Endpoint: `POST /auth/login`

Fields:
- `email` (string, required, valid email)
- `password` (string, required)

Expected response data:
- `user`

### Email Verification Request Form
Endpoint: `POST /auth/verify-email/request`

Fields:
- `email` (string, required, valid email)

### Email Verification Confirm Form
Endpoint: `POST /auth/verify-email/confirm`

Fields:
- `token` (string, required, min length 10)

### Forgot Password Form
Endpoint: `POST /auth/forgot-password`

Fields:
- `email` (string, required, valid email)

### Reset Password Form
Endpoint: `POST /auth/reset-password`

Fields:
- `token` (string, required, min length 10)
- `newPassword` (string, required, min 8, max 128)

### Event Create Form
Endpoint: `POST /events`

Fields:
- `title` (string, required, min 3, max 160)
- `description` (string, required, min 10)
- `imageUrl` (string URL, optional; can be empty string)
- `categoryId` (UUID string, optional; can be empty string)
- `addressLine` (string, optional; can be empty string)
- `formattedAddress` (string, optional; can be empty string)
- `providerPlaceId` (string, optional; can be empty string)
- `latitude` (number, required, -90 to 90)
- `longitude` (number, required, -180 to 180)
- `startDate` (ISO date/time, required)
- `endDate` (ISO date/time, required, must be later than `startDate`)

### Event Update Form
Endpoint: `PATCH /events/:id`

Fields:
- Same as event create, but all optional.
- At least one field must be provided.

### Event Search/Filter Form
Endpoint: `GET /events`

Query fields:
- `q` (string, optional)
- `status` (`PENDING | APPROVED | REJECTED`, optional)
- `category` (UUID string, optional; category id)
- `startDateFrom` (date string, optional)
- `startDateTo` (date string, optional)
- `page` (number, optional, default 1)
- `limit` (number, optional, default 12, max 50)

UI behavior recommendation:
- On home page, fetch `page=1&limit=12` initially and render that chunk only.
- Use a **Load more** button to request next pages and append results.
- Hide/disable **Load more** when `page >= totalPages`.
- Reset to first page when search/filter inputs change.

### Upload Image Form
Endpoint: `POST /uploads/event-image` (`multipart/form-data`)

Fields:
- `image` (file, required, MIME must be `image/*`, max size 2MB)
- `eventId` (UUID string, optional)

Expected response data:
- `url`, `publicId`, `width`, `height`, `format`
- `eventImage` (present when `eventId` is provided)

## Admin App Forms

All admin endpoints require an authenticated user with `role = ADMIN`.

### Create Category Form
Endpoint: `POST /categories`

Fields:
- `name` (string, required, min 2, max 100)
- `slug` (string, required, min 2, max 120, regex `^[a-z0-9-]+$`)

### Reject Event Form
Endpoint: `PATCH /admin/events/:id/reject`

Fields:
- `rejectionReason` (string, required, min 3, max 500)

### Audit Log Filters
Endpoint: `GET /admin/audit-logs`

Query fields:
- `actorUserId` (UUID, optional)
- `targetType` (string, optional)
- `targetId` (string, optional)
- `page` (number, optional, default 1)
- `limit` (number, optional, default 20, max 100)

## Non-form Actions (No Body)
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /categories`
- `GET /events/:id`
- `GET /events/my/list`
- `DELETE /events/:id`
- `GET /events/:id/images`
- `DELETE /events/:id/images/:imageId`
- `GET /admin/events/pending`
- `PATCH /admin/events/:id/approve`
- `GET /admin/users`
- `PATCH /admin/users/:id/promote`
- `PATCH /admin/users/:id/deactivate`
- `DELETE /admin/users/:id`
