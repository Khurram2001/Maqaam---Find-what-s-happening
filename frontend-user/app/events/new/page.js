import { SiteHeader } from "@/components/home/site-header";
import { CreateEventScreen } from "@/components/events/create-event-screen";

export const metadata = {
  title: "Host a New Gathering · Maqaam",
  description: "Submit your community gathering, circle, or lecture for moderation review on Maqaam.",
};

export default function NewEventPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-muted/15">
        <CreateEventScreen />
      </main>
    </>
  );
}
