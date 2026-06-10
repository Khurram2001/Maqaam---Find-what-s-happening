import Link from "next/link";

import { EventCard } from "@/components/home/event-card";

export function UpcomingEventsSection({ events }) {
  return (
    <section className="bg-[#FAF6F0] py-10 sm:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0B4D53]/70">
              Upcoming Events
            </p>
            <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight text-[#0B4D53] sm:text-2xl md:text-3xl">
              Closest gatherings near you
            </h2>
          </div>
          <Link
            href="/events"
            className="shrink-0 text-sm font-medium text-[#0B4D53] hover:underline"
          >
            See all events
          </Link>
        </div>

        {events.length > 0 ? (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {events.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl bg-white/70 p-8 text-center text-sm text-[#0B4D53]/75 shadow-[0_10px_30px_rgba(11,77,83,0.06)]">
            No upcoming events available right now. Check back soon.
          </div>
        )}
      </div>
    </section>
  );
}
