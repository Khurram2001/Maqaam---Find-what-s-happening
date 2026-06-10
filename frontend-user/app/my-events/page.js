import { SiteHeader } from "@/components/home/site-header";
import { MyEventsDashboard } from "@/components/dashboard/my-events-dashboard";

export const metadata = {
  title: "My events · Maqaam",
  description: "Review your submitted events and moderation status on Maqaam.",
};

export default function MyEventsPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-[#FAF6F0]">
        <MyEventsDashboard />
      </main>
    </>
  );
}
