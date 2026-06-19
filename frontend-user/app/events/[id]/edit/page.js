import { EventEditScreen } from "@/components/events/event-edit-screen";
import { SiteHeader } from "@/components/home/site-header";

export const metadata = {
  title: "Edit Event",
  description: "Update your event details before moderation.",
};

export default async function EventEditPage({ params }) {
  const { id } = await params;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-muted/15">
        <EventEditScreen eventId={id} />
      </main>
    </>
  );
}
