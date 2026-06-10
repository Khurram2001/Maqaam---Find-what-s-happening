import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, MapPin } from "lucide-react";

import { formatEventDate, formatEventTimeRange } from "@/lib/format-event";
import { cn } from "@/lib/utils";

/**
 * @param {{ event: { id: string; title: string; description?: string | null; imageUrl?: string | null; startDate: string; endDate: string; formattedAddress?: string | null; addressLine?: string | null; category?: { name?: string } | null }; className?: string }} props
 */
export function EventCard({ event, className }) {
  return (
    <Link
      href={`/events/${event.id}`}
      aria-label={`View event on map: ${event.title}`}
      className="group block h-full"
    >
      <article
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-2xl border border-[#0B4D53]/8 bg-white shadow-sm",
          "motion-safe:transform-gpu motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out",
          "motion-safe:hover:-translate-y-1 hover:border-[#0B4D53]/20 hover:shadow-[0_12px_24px_-10px_rgba(11,77,83,0.15)]",
          className
        )}
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#D4E6F1]/40 sm:aspect-video">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.02]"
              priority={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#0B4D53]/30">
              <Calendar className="size-8" aria-hidden />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          {event.category?.name ? (
            <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#0B4D53]/55">
              {event.category.name}
            </p>
          ) : null}
          <h3 className="font-heading text-[0.9375rem] font-semibold leading-snug text-[#0B4D53] transition group-hover:text-[#0a444a] sm:text-base">
            {event.title}
          </h3>
          {event.description ? (
            <p className="mt-2 line-clamp-2 min-h-[2.5rem] overflow-hidden text-ellipsis text-sm text-[#0B4D53]/70">
              {event.description}
            </p>
          ) : null}
          <div className="mt-3 space-y-2 text-sm text-[#0B4D53]/75">
            <p className="flex items-center gap-2">
              <Calendar className="size-3.5 shrink-0 text-[#0B4D53]/50" aria-hidden />
              {formatEventDate(event.startDate)}
            </p>
            <p className="flex items-center gap-2">
              <Clock className="size-3.5 shrink-0 text-[#0B4D53]/50" aria-hidden />
              {formatEventTimeRange(event.startDate, event.endDate)}
            </p>
            {event.formattedAddress || event.addressLine ? (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#0B4D53]/50" aria-hidden />
                <span className="line-clamp-2">{event.formattedAddress || event.addressLine}</span>
              </p>
            ) : null}
          </div>
          <span className="mt-4 inline-flex text-sm font-medium text-[#0B4D53] underline-offset-4 transition group-hover:underline">
            View on Map
          </span>
        </div>
      </article>
    </Link>
  );
}
