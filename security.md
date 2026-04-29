# Security Measures Log

This file tracks implemented security controls in the project.

## Rule
- Update this file for every meaningful security-related change.
- Keep entries short, timestamped, and include changed file paths.

## Current Baseline (as of 2026-04-29)
- Auth uses access + refresh token model with server-side refresh session tracking.
- Refresh tokens are hashed before storage in `AuthSession.refreshTokenHash`.
- Email verification is enforced before login/refresh.
- Password reset and email verification use expiring, hashed, one-time tokens.
- Password reset revokes active sessions for the user.
- Protected/admin routes enforce `requireAuth` and `requireAdmin`.
- Request validation is applied with Zod on key input surfaces.
- Upload endpoint accepts image MIME only and enforces 2MB size limit.
- Sensitive routes have rate limiting (auth, email actions, uploads).
- Audit logs exist for major auth/admin/event actions.

## Entries

### 2026-04-29 (UTC+5) - Security log initialized
- Added `security.md` at project root with baseline security controls and maintenance rule.
- Baseline references include:
  - `backend/src/routes/auth.routes.js`
  - `backend/src/middleware/auth.middleware.js`
  - `backend/src/routes/admin.routes.js`
  - `backend/src/routes/uploads.routes.js`
  - `backend/src/middleware/rate-limit.middleware.js`
