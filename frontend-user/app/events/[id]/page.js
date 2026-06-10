import { EventDetailScreen } from "@/components/events/event-detail-screen";
import { SiteHeader } from "@/components/home/site-header";
import { getApiBaseUrl } from "@/lib/config";

export async function generateMetadata({ params }) {
  const { id } = await params;
  let title = "Event · Maqaam";
  try {
    const res = await fetch(`${getApiBaseUrl()}/events/${id}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const j = await res.json();
      if (j.success && j.data?.event?.title) {
        title = `${j.data.event.title} · Maqaam`;
      }
    }
  } catch {
    /* API unreachable (e.g. offline build) */
  }
  return {
    title,
    description: "View date, location, and details for this Maqaam gathering.",
  };
}

export default async function EventDetailPage({ params }) {
  const { id } = await params;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-[#FAF6F0]">
        <EventDetailScreen eventId={id} />
      </main>
    </>
  );
}
