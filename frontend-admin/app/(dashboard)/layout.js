import { AdminProtectedLayout } from "@/components/admin/admin-protected-layout";

export default function DashboardLayout({ children }) {
  return <AdminProtectedLayout>{children}</AdminProtectedLayout>;
}
