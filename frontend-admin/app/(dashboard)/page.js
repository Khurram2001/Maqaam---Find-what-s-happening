import { LazyModerationDashboard } from "@/components/admin/admin-lazy-screens";

export const metadata = {
  title: "Events",
  description: "Review and moderate submitted gatherings on Maqaam.",
};

export default function Home() {
  return <LazyModerationDashboard />;
}
