---
name: Mems Delivery Phases
overview: Build MEMS in a backend-first sequence so auth, moderation, and data contracts are stable before either frontend. Then ship user app MVP, followed by admin moderation and hardening.
todos:
  - id: confirm-api-contract
    content: Finalize API routes, payloads, and auth cookie strategy before coding.
    status: pending
  - id: build-backend-first
    content: Implement and verify DB schema, auth, events, moderation, and validation in backend.
    status: pending
  - id: ship-user-mvp
    content: Build user frontend with auth modal, event listing, dashboard, and event submission with Leaflet + geocoder.
    status: pending
  - id: ship-admin-mvp
    content: Build admin frontend for moderation queue, user management, and stats.
    status: pending
  - id: harden-and-release
    content: Run security/QA/performance pass and deploy all apps with production verification.
    status: pending
isProject: false
---

# MEMS Start-to-Finish Approach

## Build order (single-direction)
Start with **backend and database first**, then complete the **user frontend**, then the **admin frontend**, then production hardening.

This order avoids duplicate logic and prevents UI rework when API contracts change.

## Phase 0: Project Setup & Contracts (1-2 days)
- Create/confirm repo structure: `backend`, `frontend-user`, `frontend-admin`.
- Define `.env` contract for all apps (DB URL, JWT secrets, Cloudinary; map/geocoder keys only in frontends per `docs/mapping.md`).
- Lock API conventions early:
  - Response shape (`success`, `data`, `error`)
  - Pagination/filter format
  - Auth cookie behavior and token expiry strategy
- Convert the blueprint into a concrete API spec (routes + payloads + status codes).

**Exit criteria**
- Folder structure ready.
- Env templates defined.
- API contract documented and approved.

## Phase 1: Database + Backend Core (3-5 days)
- Implement Prisma models/enums from `prompt.md`:
  - `users`, `categories`, `events`
  - optional/recommended: `event_images`, `auth_sessions`, `audit_logs`
- Add indexes and DB constraints (date checks, lat/lng ranges).
- Build auth module:
  - register/login/logout/me
  - HTTP-only cookie JWT flow (+ refresh/session lifecycle if enabled)
- Build middleware:
  - `isAuth`, `isAdmin`, central error handler, request validation
- Build event APIs:
  - create/update/delete (owner/admin rules)
  - list/search/filter (date, category, location)
  - my-events endpoint
- Build moderation APIs:
  - pending queue
  - approve/reject with actor/timestamp persistence
- Add Cloudinary upload endpoint; validate coordinates and address fields from client (no Google Places server dependency).

**Exit criteria**
- All required APIs functional in Postman/Thunder.
- Role/ownership checks enforced in backend.
- Migrations stable on a fresh DB.

## Phase 2: User Frontend MVP (4-6 days)
- Build design foundation (minimalist system) using Tailwind CSS as the base styling system and shadcn/ui for reusable UI primitives; keep custom CSS minimal and token-focused.
- Public pages/components:
  - Navbar
  - Hero + search/filter bar
  - Event grid + event cards with incremental loading (`Load more` button), not full list render
- Auth UX:
  - single modal (login/register tabs)
  - route guards for private areas
- Private dashboard:
  - My Events list + status badges
- Event creation flow:
  - form validation
  - image upload
  - LocationIQ or Geoapify autocomplete + Leaflet map/marker; grid uses static thumbnails or icons where possible
  - submit with `formattedAddress` + `latitude/longitude`

**Exit criteria**
- User can register/login, create event, and see status in dashboard.
- Search/filter works against backend APIs.
- Home event listing uses paginated fetch (`page` + `limit`) with `Load more` UX and proper loading/end states.
- UI follows minimalist design language consistently.

## Phase 3: Admin Frontend MVP (3-4 days)
- Admin auth screen and protected admin layout.
- Pending approvals queue with event preview.
- Approve/reject actions connected to backend moderation endpoints.
- User management table with promote/deactivate/delete actions as defined.
- Stats cards (total events, pending, users).
- Reuse the same Tailwind + shadcn/ui component system to keep admin UI consistent with user app and speed delivery.

**Exit criteria**
- Admin can moderate events end-to-end.
- Admin actions are persisted and auditable.

## Phase 4: Stabilization, Security & QA (2-4 days)
- Security hardening:
  - rate limiting
  - CORS/cookie policy
  - input sanitization
  - key restrictions for MapTiler / LocationIQ or Geoapify / Cloudinary
- Reliability:
  - loading/empty/error states
  - retry and graceful error messaging
- Test pass:
  - backend route tests for auth + moderation rules
  - critical frontend integration checks
- Performance pass:
  - query/index verification for list/filter endpoints

**Exit criteria**
- No critical auth/moderation bugs.
- Key user/admin flows pass test checklist.

## Phase 5: Deployment & Handover (1-2 days)
- Deploy backend + DB migrations.
- Deploy `frontend-user` and `frontend-admin`.
- Configure production env vars and domain/cookie settings.
- Smoke test production flows (auth, create event, approve/reject, filters).
- Prepare short runbook (rollback, env update, common issues).

**Exit criteria**
- Production-ready release with documented operational steps.

## Practical execution rule
For each phase, work in this loop:
1. Build only that phase scope
2. Verify against exit criteria
3. Freeze and tag milestone
4. Move to next phase

This keeps you moving from one side to finish without bouncing between unfinished modules.
