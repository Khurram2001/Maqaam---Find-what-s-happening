import { LazyCategoriesScreen } from "@/components/admin/admin-lazy-screens";

export const metadata = {
  title: "Categories · Maqaam Admin",
  description: "Manage gathering categories for Maqaam.",
};

export default function AdminCategoriesPage() {
  return <LazyCategoriesScreen />;
}
