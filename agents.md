# Agents Development Log

This file is updated every time development work is done.

## Rules
- Update this file for every meaningful development step.
- Keep entries short and timestamped.
- Mention changed files and what was implemented.

## Entries

### 2026-04-28 (UTC+5) - Resend env placeholders added
- Added Resend and email-flow configuration placeholders in `backend/.env`:
  - `RESEND_API_KEY`
  - `EMAIL_FROM`
  - `FRONTEND_USER_BASE_URL`
  - `EMAIL_VERIFY_TOKEN_TTL_MINUTES`
  - `PASSWORD_RESET_TOKEN_TTL_MINUTES`

### 2026-04-28 (UTC+5) - Resend email verification + forgot password flows implemented
- Added Prisma auth-email lifecycle schema updates in `backend/prisma/schema.prisma`:
  - `User.isEmailVerified`, `User.emailVerifiedAt`
  - `VerificationToken` and `PasswordResetToken` models
- Created and applied migration:
  - `backend/prisma/migrations/20260428092227_auth_email_verification_and_reset/migration.sql`
- Installed Resend SDK and added email service:
  - `backend/src/services/email.service.js`
  - uses `Resend` from `resend`, env key `RESEND_API_KEY`, `{ data, error }` handling, idempotency keys
- Added secure token helper:
  - `backend/src/utils/token.js` (`generateTokenPair`, `hashRawToken`)
- Extended auth routes in `backend/src/routes/auth.routes.js`:
  - strict login block for unverified users (`403`)
  - `POST /api/auth/verify-email/request`
  - `POST /api/auth/verify-email/confirm`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
  - register now issues verification token + verification email
  - reset password revokes existing sessions
- Expanded rate limiting:
  - new `emailActionRateLimiter` in `backend/src/middleware/rate-limit.middleware.js`
  - applied to verify/forgot/reset email flows
- Updated env/config surfaces:
  - `backend/.env.example` (Resend + email-link config vars)
  - `backend/src/config/env.js` exports for frontend URL + token TTLs
- Extended auth middleware user selection in `backend/src/middleware/auth.middleware.js` to include email verification fields.

### 2026-04-28 (UTC+5) - Smoke test env-path fix
- Updated `backend/scripts/smoke-test.js` to explicitly load `backend/.env` via absolute path from script directory.
- This allows running the smoke script from project root (`node backend/scripts/smoke-test.js`) without missing env variables.

### 2026-04-28 (UTC+5) - Backend smoke test flow added and executed
- Added `backend/scripts/smoke-test.js` to run an end-to-end API smoke test sequence:
  - health check
  - user/admin registration
  - admin promotion (DB update)
  - category creation
  - event creation
  - admin pending list + approve
  - public events fetch
- Executed the script successfully with all checks passing.

### 2026-04-28 (UTC+5) - Frontend-integration gap fixes applied
- Created and applied initial Prisma migration:
  - `backend/prisma/migrations/20260428071532_init/migration.sql`
  - Database is now managed by Prisma Migrate and in sync with schema.
- Fixed `POST /api/auth/refresh` error handling in `backend/src/routes/auth.routes.js` so non-auth server errors are no longer masked as `401`.
- Fixed partial event updates in `backend/src/routes/events.routes.js` by validating merged `startDate` / `endDate` values before saving.
- Fixed upload flow in `backend/src/routes/uploads.routes.js` to validate and authorize `eventId` before uploading to Cloudinary.
- Improved cookie behavior in `backend/src/utils/auth.js`:
  - omit `domain` for `localhost`
  - use `SameSite=None` automatically when `COOKIE_SECURE=true`, otherwise `lax`
- Added basic rate limiting:
  - new `backend/src/middleware/rate-limit.middleware.js`
  - applied auth limiter to `register`, `login`, `refresh`, `logout`
  - applied upload limiter to `POST /api/uploads/event-image`

### 2026-04-28 (UTC+5) - Upload API implemented
- Added `backend/src/routes/uploads.routes.js` with `POST /api/uploads/event-image`.
- Integrated `multer` memory upload, image-only validation, 5MB limit, and Cloudinary upload.
- Wired upload routes in `backend/src/routes/index.js` (`/api/uploads`).
- Extended upload endpoint with optional `eventId` attachment flow:
  - Validates `eventId` (UUID), enforces owner/admin access, creates `EventImage` row, and auto-sets `Event.imageUrl` when empty.
- Added event image management in `backend/src/routes/events.routes.js`:
  - `GET /api/events/:id/images` (public for approved events; owner/admin for non-approved)
  - `DELETE /api/events/:id/images/:imageId` (owner/admin)
  - On delete: removes DB record, attempts Cloudinary cleanup by `publicId`, and refreshes event primary `imageUrl`.
- Added lightweight audit logging support:
  - New helper `backend/src/utils/audit.js` for safe non-blocking `AuditLog` writes.
  - Integrated audit writes in auth routes (`register`, `login`, `logout`), event routes (`create`, `update`, `soft delete`, `image delete`), and admin routes (`approve/reject`, `promote/deactivate/delete user`).
- Added `GET /api/admin/audit-logs` in `backend/src/routes/admin.routes.js` with filters:
  - `actorUserId`
  - `targetType`
  - `targetId`
  - `page`
  - `limit`
  and pagination metadata in the response.

### 2026-04-28 (UTC+5) - Admin APIs implemented (moderation + user management)
- Added `backend/src/routes/admin.routes.js`:
  - `GET /api/admin/events/pending`
  - `PATCH /api/admin/events/:id/approve`
  - `PATCH /api/admin/events/:id/reject`
  - `GET /api/admin/users`
  - `PATCH /api/admin/users/:id/promote`
  - `PATCH /api/admin/users/:id/deactivate`
  - `DELETE /api/admin/users/:id`
- Applied admin protection globally on admin routes via `requireAuth` + `requireAdmin`.
- Wired admin routes in `backend/src/routes/index.js` (`/api/admin`).

### 2026-04-28 (UTC+5) - Event table API implemented
- Added `backend/src/routes/events.routes.js` with:
  - `GET /api/events` (public; approved-only by default, admin status filtering via optional auth)
  - `GET /api/events/:id` (approved for public; owner/admin can view non-approved)
  - `POST /api/events` (auth; creates `PENDING` events)
  - `PATCH /api/events/:id` (owner/admin; owner updates reset status to `PENDING`)
  - `DELETE /api/events/:id` (owner/admin soft delete via `deletedAt`)
  - `GET /api/events/my/list` (auth user’s own events)
- Added validation and pagination/query filtering for list endpoint.
- Wired event routes in `backend/src/routes/index.js`.

### 2026-04-28 (UTC+5) - Category table API started
- Implemented `Category` routes in `backend/src/routes/categories.routes.js`:
  - `GET /api/categories` (public)
  - `POST /api/categories` (auth + admin)
- Added request validation via Zod and conflict handling (`409`) for duplicate `name`/`slug`.
- Wired category routes in `backend/src/routes/index.js`.

### 2026-04-28 (UTC+5) - MapTiler key placeholders updated
- Updated `NEXT_PUBLIC_MAPTILER_API_KEY` default value in:
  - `frontend-user/.env.example`
  - `frontend-admin/.env.example`
- Set default key to the provided MapTiler key for faster local setup.

### 2026-04-28 (UTC+5) - DATABASE_URL encoding fix
- Updated `backend/.env` `DATABASE_URL` to URL-encoded password format for Supabase Session Pooler connectivity.

### 2026-04-28 (UTC+5) - Auth API MVP implemented
- Switched Prisma generator to `prisma-client-js` in `backend/prisma/schema.prisma` and regenerated client for CommonJS backend compatibility.
- Added Prisma Postgres adapter runtime (`@prisma/adapter-pg` + `pg`) and wired it in `backend/src/lib/prisma.js` for Prisma v7 engine compatibility.
- Added auth infrastructure:
  - `backend/src/lib/prisma.js`
  - `backend/src/utils/auth.js`
  - `backend/src/middleware/auth.middleware.js`
- Implemented `backend/src/routes/auth.routes.js`:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Wired auth router in `backend/src/routes/index.js` and extended API error payload with optional validation details in `backend/src/app.js`.

### 2026-04-28 (UTC+5) - Mapping stack: Leaflet / MapTiler / LocationIQ
- Dropped Google Maps server env from backend templates; geocoding is client-side via LocationIQ or Geoapify.
- Renamed `Event.googlePlaceId` → `providerPlaceId` in [backend/prisma/schema.prisma](backend/prisma/schema.prisma); event API payload updated in [docs/api-contract.md](docs/api-contract.md).
- Added [docs/mapping.md](docs/mapping.md) (Leaflet + react-leaflet, tiles, Phase 2.2 grid/search notes).
- Updated env examples: [backend/.env.example](backend/.env.example), [frontend-user/.env.example](frontend-user/.env.example), [frontend-admin/.env.example](frontend-admin/.env.example); removed `GOOGLE_MAPS_SERVER_API_KEY` from [backend/.env](backend/.env).
- Aligned [prompt.md](prompt.md) and [plan.md](plan.md) with the new mapping stack.

### 2026-04-27 16:47 (UTC+5) - Logging policy enabled
- Added `agents.md` as root development log.
- Agreed workflow: update this file on each development iteration.

### 2026-04-27 16:41 (UTC+5) - Phase 0 setup completed
- Created project folders: `backend`, `frontend-user`, `frontend-admin`, `docs`.
- Added env templates:
  - `backend/.env.example`
  - `frontend-user/.env.example`
  - `frontend-admin/.env.example`
- Added API contract: `docs/api-contract.md`.

### 2026-04-27 16:52 (UTC+5) - Phase 1 started (backend bootstrap)
- Initialized backend npm project and installed core dependencies.
- Added scripts in `backend/package.json` for dev/start/Prisma commands.
- Initialized Prisma and created first schema models/enums:
  - `User`, `Category`, `Event`, `EventImage`, `AuthSession`, `AuditLog`
  - `Role`, `EventStatus`
- Scaffolded minimal Express structure:
  - `backend/src/server.js`
  - `backend/src/app.js`
  - `backend/src/config/env.js`
  - `backend/src/routes/index.js`
  - `backend/src/routes/health.routes.js`
- Updated `backend/.env` for local MVP defaults.
- Fixed Prisma v7 datasource config issue and generated Prisma client successfully.

### 2026-04-27 17:13 (UTC+5) - Frontend setup completed first
- Scaffolded `frontend-user` with Next.js (App Router + Tailwind + ESLint).
- Scaffolded `frontend-admin` with Next.js (App Router + Tailwind + ESLint).
- Added env templates:
  - `frontend-user/.env.example`
  - `frontend-admin/.env.example`
- Replaced default starter pages with simple project-ready placeholders:
  - `frontend-user/app/page.js`
  - `frontend-admin/app/page.js`
