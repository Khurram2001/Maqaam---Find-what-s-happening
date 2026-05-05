# Agents Development Log

This file is updated every time development work is done.

## Rules
- Update this file for every meaningful development step.
- Keep entries short and timestamped.
- Mention changed files and what was implemented.

## Entries

### 2026-05-04 (UTC+5) - Frontend user hydration warning guard
- Updated `frontend-user/app/layout.js` to add `suppressHydrationWarning` on the root `<body>` to prevent extension-injected attributes (e.g., Grammarly) from triggering client hydration mismatch warnings in local dev.
- Re-ran `frontend-user` lint to confirm no regressions.

### 2026-05-04 (UTC+5) - User Phase 4 checks: test baseline added
- Added `vitest` setup in `frontend-user/package.json` (`npm test`).
- Added `frontend-user/tests/user-lib.test.js` with baseline automated checks for user-side helpers and API adapters: `lib/config.js` (`getApiBaseUrl`), `lib/format-event.js` (`formatEventRange`), `lib/api-client.js` (`apiJson` request/error shape), and `lib/public-api.js` (`getPublicEvents` success/fallback).
- Updated `frontend-user/AGENTS.md` with the new test coverage note.

### 2026-05-04 (UTC+5) - Admin Step 7: automated validation checks
- Added/expanded `frontend-admin/lib/admin-validation.js` with reusable filter validation (`validateAuditFilters`) and delete-confirm token checking.
- Updated admin screens to consume the shared validation helpers (`frontend-admin/components/admin/admin-audit-logs-screen.jsx`, `frontend-admin/components/admin/admin-users-screen.jsx`) to reduce duplicated validation logic.
- Added test setup for `frontend-admin` (`vitest`) with `npm test` script and `frontend-admin/tests/admin-validation.test.js` covering UUID checks, reject reason constraints, target type normalization, audit filter validation, and delete token confirmation behavior.
- Updated `frontend-admin/AGENTS.md` with Step 7 notes.

### 2026-05-04 (UTC+5) - Admin Step 6: Phase 4 UX hardening
- Added `frontend-admin/lib/admin-validation.js` for shared client-side validation helpers (UUID checks, reject reason guard, and `targetType` normalization/validation).
- Updated `frontend-admin/components/admin/admin-moderation-dashboard.jsx`, `frontend-admin/components/admin/admin-users-screen.jsx`, `frontend-admin/components/admin/admin-audit-logs-screen.jsx`, and `frontend-admin/components/admin/admin-event-review-screen.jsx` with clearer loading/empty states, retry actions after failed API calls, and success notices after admin actions.
- Added stronger destructive-action safety in users screen (`DELETE` typed confirmation) and stricter reject/filter validation before sending API requests.
- Updated `frontend-admin/AGENTS.md` with Step 6 notes.

### 2026-05-04 (UTC+5) - Admin Step 5: protected layout + sign-in + stats
- Added `frontend-admin/components/admin/admin-protected-layout.jsx` and wrapped protected pages (`frontend-admin/app/page.js`, `frontend-admin/app/users/page.js`, `frontend-admin/app/audit-logs/page.js`, `frontend-admin/app/events/[id]/page.js`) so admin gating (`GET /auth/me`) and nav/sign-out (`POST /auth/logout`) are shared in one place.
- Added `frontend-admin/components/admin/admin-sign-in-screen.jsx` and `frontend-admin/app/sign-in/page.js` for dedicated admin login via `POST /auth/login`, with non-admin rejection flow.
- Updated admin screens to remove duplicated per-page auth/nav boilerplate and updated `frontend-admin/components/admin/admin-moderation-dashboard.jsx` stats cards to include total events, pending events, and total users by aggregating existing API totals.
- Updated `frontend-admin/AGENTS.md` with Step 5 notes.

### 2026-05-04 (UTC+5) - Admin Step 4: audit logs screen
- Added `frontend-admin/app/audit-logs/page.js` and `frontend-admin/components/admin/admin-audit-logs-screen.jsx` with admin guard, filter form (`actorUserId`, `targetType`, `targetId`), paginated `GET /admin/audit-logs`, and JSON `meta` rendering per log row.
- Added audit navigation links in `frontend-admin/components/admin/admin-moderation-dashboard.jsx`, `frontend-admin/components/admin/admin-event-review-screen.jsx`, and `frontend-admin/components/admin/admin-users-screen.jsx`.
- Updated `frontend-admin/AGENTS.md` with Step 4 notes.

### 2026-05-04 (UTC+5) - Admin Step 3: users management screen
- Added `frontend-admin/app/users/page.js` and `frontend-admin/components/admin/admin-users-screen.jsx` with admin guard, paginated `GET /admin/users`, and user actions wired to `PATCH /admin/users/:id/promote`, `PATCH /admin/users/:id/deactivate`, and `DELETE /admin/users/:id`.
- Added navigation links between admin queue/review/users screens via updates in `frontend-admin/components/admin/admin-moderation-dashboard.jsx` and `frontend-admin/components/admin/admin-event-review-screen.jsx`.
- Updated `frontend-admin/AGENTS.md` with Step 3 notes.

### 2026-05-04 (UTC+5) - Admin Step 2: event review screen
- Added `frontend-admin/app/events/[id]/page.js` and `frontend-admin/components/admin/admin-event-review-screen.jsx` for moderation review with admin guard, `GET /events/:id` event context, and approve/reject actions (`PATCH /admin/events/:id/approve`, `PATCH /admin/events/:id/reject`).
- Updated `frontend-admin/components/admin/admin-moderation-dashboard.jsx` to include a per-row **Review** link into the new route.
- Updated `frontend-admin/AGENTS.md` with Step 2 notes.

### 2026-05-04 (UTC+5) - Admin Step 1: guard + pending queue
- Added `frontend-admin/lib/config.js` and `frontend-admin/lib/api-client.js` for cookie-based API calls (`credentials: include`) with network-safe error shape.
- Replaced `frontend-admin/app/page.js` placeholder with `frontend-admin/components/admin/admin-moderation-dashboard.jsx` and updated `frontend-admin/app/layout.js` metadata.
- Implemented admin guard flow (`GET /auth/me`) and pending moderation screen (`GET /admin/events/pending` with pagination), including inline approve/reject actions wired to `PATCH /admin/events/:id/approve` and `PATCH /admin/events/:id/reject`.
- Updated `frontend-admin/AGENTS.md` with the new admin Step 1 behavior.

### 2026-05-04 (UTC+5) - User event edit/detail polish
- `frontend-user/components/events/event-edit-screen.jsx`: unsaved-change detection vs loaded snapshot, `beforeunload` + confirm on leave links, inline “unsaved changes” hint, stricter delete flow for `APPROVED` events (second confirm + type `DELETE`), redirect to detail with `?updated=1` after save; address pick sets `providerPlaceId` from OSM id or LocationIQ place id.
- `frontend-user/components/events/event-detail-screen.jsx`: dismissible “Changes saved” banner when `updated=1` query is present; strips query via `router.replace`.

### 2026-05-04 (UTC+5) - User events edit screen added
- Added `frontend-user/app/events/[id]/edit/page.js` + `frontend-user/components/events/event-edit-screen.jsx` with owner/admin guard (`GET /auth/me` + `GET /events/:id`), prefilled edit form, map/location search, optional image replacement upload (`POST /uploads/event-image`), update action (`PATCH /events/:id`), and delete action (`DELETE /events/:id`).
- Updated `frontend-user/components/events/event-detail-screen.jsx` to show Edit action for owner/admin and keep detail map read-only.
- Updated `frontend-user/components/dashboard/my-events-dashboard.jsx` cards to expose both View and Edit actions.

### 2026-05-04 (UTC+5) - User dashboard: My events + create placeholder
- Added `app/my-events/page.js` + `components/dashboard/my-events-dashboard.jsx`: client gate via `GET /auth/me`; guests see sign-in guidance; signed-in users load `GET /events/my/list` with status badges (pending / approved / rejected), rejection reason, links to `/events/:id`, and **Create event** CTA to `/events/new`.
- Added `app/events/new/page.js` placeholder (next step: full create form) with nav back to My events / discover.
- Extracted `lib/format-event.js` (`formatEventRange`) and reused from `event-discovery.jsx`.
- Updated `site-header.jsx` nav (My events when logged in, Create event → `/events/new`), `user-menu.jsx` (My events item), `hero-section.jsx` (Host an event → `/events/new`).

### 2026-05-04 (UTC+5) - User routes: verify email + reset password
- Added `app/verify-email/page.js` + `verify-email-inner.jsx` (Suspense + `useSearchParams`) and `components/auth/verify-email-client.jsx` calling `POST /auth/verify-email/confirm` (manual **Verify my email** button to avoid double-submit in Strict Mode).
- Added `app/reset-password/page.js` + `reset-password-inner.jsx` and `components/auth/reset-password-client.jsx` with Zod-matched password + confirm, calling `POST /auth/reset-password`.
- Both screens use shadcn Card/Alert/Button/Input/Label and match minimalist Maqaam styling; `npm run lint` / `npm run build` pass.

### 2026-05-04 (UTC+5) - User app auth (register, login, forgot, verify resend)
- Added `zod`, shadcn `alert`, and `dropdown-menu` in `frontend-user/`.
- New `lib/api-client.js`: `apiJson` helper with `credentials: "include"`.
- New `components/auth/sign-in-dialog.jsx`: wired `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/verify-email/request`; client Zod validation; success state after register; unverified-login flow with resend; forgot-password sub-flow; `DialogTrigger` styled with `buttonVariants` (no nested `<button>`).
- New `components/auth/user-menu.jsx`: `GET /auth/me`-driven header state, `POST /auth/logout`, account dropdown.
- Updated `components/home/site-header.jsx`: session probe on load (`setTimeout` deferral for ESLint `set-state-in-effect`), `SignInDialog` / `UserMenu` swap.
- `npm run lint` and `npm run build` pass for `frontend-user`.

### 2026-05-04 (UTC+5) - User homepage (Maqaam) with shadcn + Tailwind
- Initialized shadcn/ui (Base UI) in `frontend-user/` and added `button`, `card`, `input`, `badge`, `dialog`, `tabs`, `separator`, `label`.
- Theming in `frontend-user/app/globals.css`: warm paper background, emerald primary, fixed `--font-sans` mapping to Geist.
- Added `lib/config.js`, `lib/public-api.js` (`getPublicEvents` with try/catch for offline builds), `next.config.mjs` Cloudinary `images.remotePatterns`.
- New home sections: `components/home/site-header.jsx` (nav + auth modal shell), `hero-section.jsx` + `hero-geometry.jsx`, `event-discovery.jsx` (search, filter dialog, cards, load more, `GET /events` + `GET /categories`), `site-footer.jsx`.
- Updated `app/layout.js` (Geist + Amiri for Arabic tagline), `app/page.js`, placeholder `app/events/[id]/page.js`.
- Root `.gitignore` already ignores agent tooling; homepage builds without API at build time.

### 2026-04-30 (UTC+5) - Backend inline comments refined
- Added concise, high-signal inline comments in `backend/src/routes/auth.routes.js`, `backend/src/routes/events.routes.js`, and `backend/src/routes/uploads.routes.js` to clarify session rotation, optional auth visibility rules, moderation reset behavior, and image attachment/primary-image side effects.

### 2026-04-30 (UTC+5) - Frontend styling stack decision documented
- Updated `plan.md` to lock frontend implementation on Tailwind CSS + shadcn/ui with minimal custom CSS for faster delivery and consistent minimalist UI.
- Updated `prompt.md` technical stack/design guidance to explicitly state Tailwind as base styling and shadcn/ui as reusable component primitives.

### 2026-04-30 (UTC+5) - Frontend event listing strategy updated
- Updated `plan.md` to require home event grid optimization via paginated fetch + `Load more` interaction and added it to Phase 2 exit criteria.
- Updated `prompt.md` user/frontend specifications to explicitly prefer incremental event loading (`Load more`) instead of rendering all events at once.
- Updated `frontend-forms.md` with concrete `GET /events` UI behavior guidance for initial page load, append-on-load-more, and reset-on-filter-change.

### 2026-04-30 (UTC+5) - Postman testing artifacts added
- Added `backend/postman_collection_mems_backend.json` with ready-to-import API requests/variables for health, auth, category, event, and admin pagination flows.
- Added `backend/postman-testing-checklist.md` with a structured execution checklist using ✔ markers for Postman verification.

### 2026-04-30 (UTC+5) - Admin list pagination added
- Updated `backend/src/routes/admin.routes.js` to add `page`/`limit` query validation and paginated responses (`data.pagination`) for `GET /api/admin/events/pending` and `GET /api/admin/users`.
- Updated `docs/api-contract.md` to document pagination query params and pagination metadata for both admin list endpoints.

### 2026-04-29 (UTC+5) - Smoke test synced with auth changes
- Updated ackend/scripts/smoke-test.js for phoneNumber register payloads, login/session checks, resilient cookie capture, and fallback user seeding when email sending is blocked in test mode.
- Re-ran smoke test successfully for core auth/admin/events flow; register currently returns EMAIL_SEND_FAILED due Resend test-recipient restriction.

### 2026-04-29 (UTC+5) - Frontend forms contract added
- Added `frontend-forms.md` in root with frontend form/query field requirements mapped to current backend APIs (auth, events, uploads, categories, admin).

### 2026-04-29 (UTC+5) - Root security log added
- Added `security.md` in project root to maintain ongoing security controls and changes during development.

### 2026-04-29 (UTC+5) - API contract updated for frontend auth/uploads
- Updated `docs/api-contract.md` to include required `phoneNumber` in `POST /auth/register`, E.164 format rule, upload image-only + 2MB limit, and `409` conflict note for duplicate phone number.

### 2026-04-29 (UTC+5) - Upload size limit reduced
- Updated `backend/src/routes/uploads.routes.js` multer `fileSize` limit from 5MB to 2MB for `POST /api/uploads/event-image`.

### 2026-04-29 (UTC+5) - Auth register phone number support
- Added `User.phoneNumber` (unique, nullable for backward compatibility) in `backend/prisma/schema.prisma` and migration `backend/prisma/migrations/20260429101700_add_user_phone_number/migration.sql`.
- Updated `backend/src/routes/auth.routes.js` register validation/storage to require E.164 `phoneNumber`, include it in sanitized user payload, and return `409` for duplicate phone numbers.
- Updated `backend/src/middleware/auth.middleware.js` to include `phoneNumber` in authenticated user selection.

### 2026-04-29 (UTC+5) - API routes manifest
- Added [`backend/src/routes/api-endpoints.js`](backend/src/routes/api-endpoints.js): exports `API_ENDPOINTS` (`method`, `path`, `group`) for all `/api` routes; cross-link comment in [`backend/src/routes/index.js`](backend/src/routes/index.js).

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
