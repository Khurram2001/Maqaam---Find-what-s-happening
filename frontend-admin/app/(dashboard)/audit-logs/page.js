import { LazyAuditLogsScreen } from "@/components/admin/admin-lazy-screens";

export const metadata = {
  title: "Audit Logs",
  description: "View admin audit logs for actions and targets.",
};

export default function AdminAuditLogsPage() {
  return <LazyAuditLogsScreen />;
}
