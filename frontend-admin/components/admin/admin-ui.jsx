import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminPageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2DD4BF]">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-[#0B4D53] sm:text-2xl lg:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#0B4D53]/70">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function AdminMetricCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-[#0B4D53]/55">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums sm:text-3xl", accent || "text-[#0B4D53]")}>{value}</p>
    </div>
  );
}

/** @param {{ timing: "past" | "today" | "upcoming" }} props */
export function ScheduleTimingBadge({ timing }) {
  const styles = {
    past: "bg-neutral-100 text-neutral-700 border-neutral-200/80",
    today: "bg-[#2DD4BF]/15 text-[#0B4D53] border-[#2DD4BF]/35",
    upcoming: "bg-sky-50 text-sky-800 border-sky-200/60",
  };
  const labels = { past: "Past", today: "Today", upcoming: "Upcoming" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        styles[timing] || styles.upcoming
      )}
    >
      {labels[timing] || timing}
    </span>
  );
}

/** @param {{ status: string }} props */
export function EventStatusBadge({ status }) {
  const normalized = String(status || "").toUpperCase();
  const styles = {
    PENDING: "bg-amber-50 text-amber-800 border-amber-200/60",
    APPROVED: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
    REJECTED: "bg-red-50 text-red-800 border-red-200/60",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        styles[normalized] || "bg-neutral-50 text-neutral-700 border-neutral-200"
      )}
    >
      {normalized || "UNKNOWN"}
    </span>
  );
}

export function ActiveStatusBadge({ isActive }) {
  return isActive ? (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
      Inactive
    </span>
  );
}

export function AdminLoadingRow({ colSpan = 1, label = "Loading…" }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-[#0B4D53]/60 sm:px-6">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin text-[#0B4D53]" aria-hidden />
          {label}
        </span>
      </td>
    </tr>
  );
}

export function AdminLoadingCards({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-neutral-100 bg-white px-4 py-12 text-sm text-[#0B4D53]/60 lg:hidden">
      <Loader2 className="mr-2 size-4 animate-spin text-[#0B4D53]" aria-hidden />
      {label}
    </div>
  );
}

/** @param {{ message: string }} props */
export function AdminEmptyCards({ message }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white px-4 py-12 text-center text-sm text-[#0B4D53]/60 lg:hidden">
      {message}
    </div>
  );
}

/** @param {{ children: React.ReactNode; className?: string }} props */
export function AdminMobileCard({ children, className }) {
  return (
    <article className={cn("rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm", className)}>{children}</article>
  );
}

export function AdminMobileOnly({ children, className }) {
  return <div className={cn("space-y-3 lg:hidden", className)}>{children}</div>;
}

export function AdminDesktopOnly({ children, className }) {
  return <div className={cn("hidden lg:block", className)}>{children}</div>;
}

/**
 * @param {{
 *   page: number;
 *   totalPages: number;
 *   total: number;
 *   totalLabel: string;
 *   loading?: boolean;
 *   onPrev: () => void;
 *   onNext: () => void;
 * }} props
 */
export function AdminPaginationBar({ page, totalPages, total, totalLabel, loading, onPrev, onNext }) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-col gap-3 border-t border-neutral-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-center text-xs text-[#0B4D53]/60 sm:text-left">
        Page {page} of {Math.max(totalPages, 1)} · {total} {totalLabel}
      </p>
      <div className="flex items-center justify-center gap-2 sm:justify-end">
        <Button type="button" variant="outline" size="sm" className="min-w-[5.5rem]" disabled={!canPrev || loading} onClick={onPrev}>
          Previous
        </Button>
        <Button type="button" variant="outline" size="sm" className="min-w-[5.5rem]" disabled={!canNext || loading} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}

export const adminInputClass =
  "h-10 w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-3 text-base text-[#0B4D53] placeholder:text-[#0B4D53]/40 outline-none transition-colors focus:border-[#0B4D53] focus:ring-1 focus:ring-[#0B4D53]/20 sm:text-sm";

export const adminTableShellClass = "overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm";

export const adminFilterPillClass = "shrink-0 rounded-xl px-3.5 py-2 text-xs font-medium transition-all whitespace-nowrap";

export function AdminFilterPills({ options, value, onChange, ariaLabel }) {
  return (
    <div className="max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
      <div
        className="inline-flex min-w-max gap-1 rounded-2xl bg-[#FAF6F0]/80 p-1 ring-1 ring-[#0B4D53]/10"
        role="group"
        aria-label={ariaLabel}
      >
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                adminFilterPillClass,
                active ? "bg-[#0B4D53] text-white shadow-sm" : "text-[#0B4D53]/70 hover:bg-[#0B4D53]/5"
              )}
              aria-pressed={active}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** @param {{ label: string; children: React.ReactNode }} props */
export function AdminFilterGroup({ label, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-[#0B4D53]/55">{label}</span>
      {children}
    </div>
  );
}
