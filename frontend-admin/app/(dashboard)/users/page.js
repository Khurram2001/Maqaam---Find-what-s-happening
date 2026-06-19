import { LazyUsersScreen } from "@/components/admin/admin-lazy-screens";

export const metadata = {
  title: "Users",
  description: "Manage users and permissions in Maqaam.",
};

export default function AdminUsersPage() {
  return <LazyUsersScreen />;
}
