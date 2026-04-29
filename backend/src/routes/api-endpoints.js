/**
 * Canonical list of HTTP API routes (all mounted under `/api` in app.js).
 * Handlers live in `*.routes.js`; when you add or change a route, update this manifest.
 */

const API_ENDPOINTS = [
  // health
  { method: "GET", path: "/api/health", group: "health" },

  // auth
  { method: "POST", path: "/api/auth/register", group: "auth" },
  { method: "POST", path: "/api/auth/login", group: "auth" },
  { method: "POST", path: "/api/auth/refresh", group: "auth" },
  { method: "POST", path: "/api/auth/logout", group: "auth" },
  { method: "POST", path: "/api/auth/verify-email/request", group: "auth" },
  { method: "POST", path: "/api/auth/verify-email/confirm", group: "auth" },
  { method: "POST", path: "/api/auth/forgot-password", group: "auth" },
  { method: "POST", path: "/api/auth/reset-password", group: "auth" },
  { method: "GET", path: "/api/auth/me", group: "auth" },

  // categories
  { method: "GET", path: "/api/categories", group: "categories" },
  { method: "POST", path: "/api/categories", group: "categories" },

  // events
  { method: "GET", path: "/api/events", group: "events" },
  { method: "GET", path: "/api/events/my/list", group: "events" },
  { method: "GET", path: "/api/events/:id", group: "events" },
  { method: "POST", path: "/api/events", group: "events" },
  { method: "PATCH", path: "/api/events/:id", group: "events" },
  { method: "DELETE", path: "/api/events/:id", group: "events" },
  { method: "GET", path: "/api/events/:id/images", group: "events" },
  { method: "DELETE", path: "/api/events/:id/images/:imageId", group: "events" },

  // admin
  { method: "GET", path: "/api/admin/events/pending", group: "admin" },
  { method: "PATCH", path: "/api/admin/events/:id/approve", group: "admin" },
  { method: "PATCH", path: "/api/admin/events/:id/reject", group: "admin" },
  { method: "GET", path: "/api/admin/users", group: "admin" },
  { method: "PATCH", path: "/api/admin/users/:id/promote", group: "admin" },
  { method: "PATCH", path: "/api/admin/users/:id/deactivate", group: "admin" },
  { method: "DELETE", path: "/api/admin/users/:id", group: "admin" },
  { method: "GET", path: "/api/admin/audit-logs", group: "admin" },

  // uploads
  { method: "POST", path: "/api/uploads/event-image", group: "uploads" },
];

module.exports = { API_ENDPOINTS };
