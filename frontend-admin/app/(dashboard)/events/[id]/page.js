import { LazyEventReviewScreen } from "@/components/admin/admin-lazy-screens";

export const metadata = {
  title: "Review event · Maqaam Admin",
  description: "Admin moderation review for a single event.",
};

export default async function AdminEventReviewPage({ params }) {
  const { id } = await params;
  return <LazyEventReviewScreen eventId={id} />;
}
