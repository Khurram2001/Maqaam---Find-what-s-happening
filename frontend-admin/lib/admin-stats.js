import { apiJson } from "@/lib/api-client";

/** @returns {Promise<{ totalEvents: number; pendingEvents: number; totalUsers: number }>} */
export async function fetchAdminDashboardStats() {
  const [pendingRes, usersRes, approvedRes, rejectedRes] = await Promise.all([
    apiJson("/admin/events/pending?page=1&limit=1"),
    apiJson("/admin/users?page=1&limit=1"),
    apiJson("/events?page=1&limit=1&status=APPROVED"),
    apiJson("/events?page=1&limit=1&status=REJECTED"),
  ]);

  const pendingTotal = pendingRes.ok ? pendingRes.json?.data?.pagination?.total ?? 0 : 0;
  const usersTotal = usersRes.ok ? usersRes.json?.data?.pagination?.total ?? 0 : 0;
  const approvedTotal = approvedRes.ok ? approvedRes.json?.data?.pagination?.total ?? 0 : 0;
  const rejectedTotal = rejectedRes.ok ? rejectedRes.json?.data?.pagination?.total ?? 0 : 0;

  return {
    totalEvents: pendingTotal + approvedTotal + rejectedTotal,
    pendingEvents: pendingTotal,
    totalUsers: usersTotal,
  };
}
