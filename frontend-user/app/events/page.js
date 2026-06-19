import { EventDiscovery } from "@/components/home/event-discovery";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";
import { BROWSE_EVENTS_PAGE_SIZE, getBrowseEventsStartDateFrom } from "@/lib/browse-events";
import { getCachedPublicEvents } from "@/lib/public-api";

export const metadata = {
  title: "Browse Gatherings",
  description: "Explore verified local lectures, halaqas, and community circles with search and filters.",
};

/** Keep in sync with PUBLIC_EVENTS_REVALIDATE in lib/public-api.js */
export const revalidate = 300;

export default async function EventsPage() {
  const { events, pagination } = await getCachedPublicEvents(1, BROWSE_EVENTS_PAGE_SIZE, {
    sort: "default",
    startDateFrom: getBrowseEventsStartDateFrom(),
  });

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <EventDiscovery initialEvents={events} initialPagination={pagination} />
      </main>
      <SiteFooter />
    </>
  );
}
