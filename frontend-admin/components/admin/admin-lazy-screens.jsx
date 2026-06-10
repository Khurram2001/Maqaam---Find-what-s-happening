"use client";

import dynamic from "next/dynamic";

import { AdminMainLoading } from "@/components/admin/admin-main-loading";

function screenLoading(label) {
  return function ScreenLoading() {
    return <AdminMainLoading label={label} />;
  };
}

export const LazyModerationDashboard = dynamic(
  () =>
    import("@/components/admin/admin-moderation-dashboard").then((m) => ({
      default: m.AdminModerationDashboard,
    })),
  { loading: screenLoading("Loading gatherings…") }
);

export const LazyUsersScreen = dynamic(
  () =>
    import("@/components/admin/admin-users-screen").then((m) => ({
      default: m.AdminUsersScreen,
    })),
  { loading: screenLoading("Loading users…") }
);

export const LazyCategoriesScreen = dynamic(
  () =>
    import("@/components/admin/admin-categories-screen").then((m) => ({
      default: m.AdminCategoriesScreen,
    })),
  { loading: screenLoading("Loading categories…") }
);

export const LazyAuditLogsScreen = dynamic(
  () =>
    import("@/components/admin/admin-audit-logs-screen").then((m) => ({
      default: m.AdminAuditLogsScreen,
    })),
  { loading: screenLoading("Loading audit logs…") }
);

export const LazyEventReviewScreen = dynamic(
  () =>
    import("@/components/admin/admin-event-review-screen").then((m) => ({
      default: m.AdminEventReviewScreen,
    })),
  { loading: screenLoading("Loading review…") }
);
