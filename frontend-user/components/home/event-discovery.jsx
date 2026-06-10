"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";

import { EventCard } from "@/components/home/event-card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BROWSE_EVENTS_PAGE_SIZE,
  filterCurrentOrUpcomingEvents,
  getBrowseEventsStartDateFrom,
} from "@/lib/browse-events";
import { getApiBaseUrl } from "@/lib/config";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "default", label: "Default View" },
  { value: "upcoming", label: "Nearest Upcoming Date" },
];

const controlInputClass =
  "h-11 rounded-xl border border-[#0B4D53]/15 bg-white text-sm text-[#0B4D53] focus-visible:border-[#0B4D53] focus-visible:ring-1 focus-visible:ring-[#0B4D53]/20";

async function fetchEventsJson(page, limit, filters) {
  const base = getApiBaseUrl();
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.startDateFrom) params.set("startDateFrom", filters.startDateFrom);

  const res = await fetch(`${base}/events?${params}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json?.error?.message || "Could not load events");
  }
  return {
    events: json.data.events ?? [],
    pagination: json.data.pagination ?? { page, limit, total: 0, totalPages: 0 },
  };
}

function matchesSearchQuery(event, query) {
  if (!query) return true;
  const needle = query.toLowerCase();
  const haystack = [
    event.title,
    event.description,
    event.formattedAddress,
    event.addressLine,
    event.category?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function buildPageNumbers(current, total) {
  if (total <= 1) return [1];
  const pages = new Set([1, total, current, current - 1, current + 1]);
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

export function EventDiscovery({ initialEvents, initialPagination }) {
  const limit = BROWSE_EVENTS_PAGE_SIZE;

  const [events, setEvents] = useState(filterCurrentOrUpcomingEvents(initialEvents ?? []));
  const [pagination, setPagination] = useState(
    initialPagination ?? { page: 1, limit, total: 0, totalPages: 0 }
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [loadingReplace, setLoadingReplace] = useState(false);
  const [listError, setListError] = useState(null);

  const categoryFilters = useMemo(
    () => [
      { value: "", label: "All Gatherings" },
      ...categories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories]
  );

  useEffect(() => {
    const base = getApiBaseUrl();
    fetch(`${base}/categories`, { credentials: "include", headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data?.categories) setCategories(j.data.categories);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(id);
  }, [searchQuery]);

  useEffect(() => {
    const filters = {
      q: debouncedSearchQuery,
      category: selectedCategoryId,
      sort: sortBy,
      startDateFrom: getBrowseEventsStartDateFrom(),
    };

    let cancelled = false;
    const queryTimer = window.setTimeout(() => {
      if (cancelled) return;
      setLoadingReplace(true);
      setListError(null);

      void fetchEventsJson(page, limit, filters)
        .then(({ events: nextEvents, pagination: nextPag }) => {
          if (cancelled) return;
          setPagination(nextPag);
          setEvents(filterCurrentOrUpcomingEvents(nextEvents));
        })
        .catch((err) => {
          if (!cancelled) setListError(err.message);
        })
        .finally(() => {
          if (!cancelled) setLoadingReplace(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(queryTimer);
    };
  }, [debouncedSearchQuery, selectedCategoryId, sortBy, page, limit]);

  const handleSortChange = (value) => {
    setSortBy(value);
    setPage(1);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategoryId(value);
    setPage(1);
  };

  const filteredEvents = useMemo(() => {
    let source = filterCurrentOrUpcomingEvents(events);
    if (debouncedSearchQuery) {
      source = source.filter((ev) => matchesSearchQuery(ev, debouncedSearchQuery));
    }
    return source;
  }, [events, debouncedSearchQuery]);

  const currentPage = pagination.page ?? 1;
  const totalPages = pagination.totalPages ?? 1;
  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  const displayEvents = filteredEvents.slice(0, limit);
  const totalResults = pagination.total ?? 0;

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
    document.getElementById("discover")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="discover" className="scroll-mt-16 bg-[#FAF6F0] sm:scroll-mt-20">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#0B4D53] sm:text-3xl md:text-4xl">
            Discover Islamic Gatherings
          </h1>
          <p className="mt-2 max-w-3xl text-base leading-relaxed tracking-wide text-[#0B4D53]/80 md:text-lg">
            Connect with local halaqas, inspiring lectures, and faith-centered events. Discover verified
            spaces near you dedicated to sacred knowledge, family fellowship, and spiritual growth.
          </p>
        </div>

        <div className="w-full min-w-0">
          <div className="mt-5 flex w-full flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
            <div className="relative min-w-0 w-full flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#0B4D53]/45"
                aria-hidden
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by gathering topic, city, or country..."
                className={cn(controlInputClass, "pl-9 placeholder:text-[#0B4D53]/40")}
                aria-label="Search gatherings by topic, city, or country"
              />
            </div>

            <div className="relative w-full sm:w-auto sm:min-w-[14.5rem] lg:min-w-[15.5rem]">
              <label htmlFor="event-sort" className="sr-only">
                Sort gatherings
              </label>
              <select
                id="event-sort"
                value={sortBy}
                disabled={loadingReplace}
                onChange={(e) => handleSortChange(e.target.value)}
                className={cn(
                  controlInputClass,
                  "w-full appearance-none pr-10 pl-3.5 disabled:opacity-60"
                )}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#0B4D53]/50"
                aria-hidden
              />
            </div>
          </div>

          <div className="no-scrollbar -mx-4 mt-4 mb-6 flex items-center gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mb-8 sm:px-0">
            {categoryFilters.map((option) => {
              const active = selectedCategoryId === option.value;
              return (
                <button
                  key={option.value || "all"}
                  type="button"
                  disabled={loadingReplace}
                  onClick={() => handleCategoryChange(option.value)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 sm:px-3.5 sm:text-sm",
                    active
                      ? "bg-[#0B4D53] text-white shadow-sm"
                      : "border border-[#0B4D53]/20 bg-white/70 text-[#0B4D53]/70 hover:border-[#0B4D53]/35 hover:text-[#0B4D53]"
                  )}
                  aria-pressed={active}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {listError ? (
          <p className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {listError}
          </p>
        ) : null}

        {loadingReplace && displayEvents.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-[#0B4D53]/10 bg-white/70">
            <Loader2 className="size-6 animate-spin text-[#0B4D53]" />
          </div>
        ) : null}

        {!loadingReplace && displayEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#0B4D53]/20 bg-white/70 px-4 py-10 text-center sm:px-6 sm:py-12">
            <p className="font-medium text-[#0B4D53]">No gatherings match yet</p>
            <p className="mt-2 text-sm text-[#0B4D53]/70">
              Try another search or filter, or check back after new submissions are approved.
            </p>
          </div>
        ) : null}

        {displayEvents.length > 0 ? (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {displayEvents.map((ev) => (
              <li key={ev.id}>
                <EventCard event={ev} />
              </li>
            ))}
          </ul>
        ) : null}

        {totalPages > 1 ? (
          <nav
            className="mt-8 flex flex-col items-stretch gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3"
            aria-label="Pagination"
          >
            <p className="w-full text-center text-xs tracking-wide text-[#0B4D53]/60">
              Showing {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, totalResults)} of{" "}
              {totalResults} gatherings · Page {currentPage} of {totalPages}
            </p>

            <div className="flex items-center justify-between gap-2 sm:contents">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1 || loadingReplace}
                onClick={() => goToPage(currentPage - 1)}
                className="min-w-0 flex-1 gap-1 rounded-lg border-[#0B4D53]/20 bg-transparent text-[#0B4D53] hover:bg-white/80 sm:min-w-[7rem] sm:flex-none"
              >
                <ChevronLeft className="size-4 shrink-0" aria-hidden />
                <span className="truncate">Previous</span>
              </Button>

              <div className="no-scrollbar hidden max-w-full items-center gap-1.5 overflow-x-auto py-1 sm:flex sm:gap-2">
                {pageNumbers.map((pageNum, index) => (
                  <span key={pageNum} className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    {index > 0 ? (
                      <span className="hidden text-sm text-[#0B4D53]/45 md:inline" aria-hidden>
                        •
                      </span>
                    ) : null}
                    <button
                      type="button"
                      disabled={loadingReplace}
                      onClick={() => goToPage(pageNum)}
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-medium transition",
                        pageNum === currentPage
                          ? "bg-[#0B4D53] text-white"
                          : "text-[#0B4D53]/75 hover:bg-white/80"
                      )}
                      aria-current={pageNum === currentPage ? "page" : undefined}
                    >
                      {pageNum}
                    </button>
                  </span>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages || loadingReplace}
                onClick={() => goToPage(currentPage + 1)}
                className="min-w-0 flex-1 gap-1 rounded-lg border-[#0B4D53]/20 bg-transparent text-[#0B4D53] hover:bg-white/80 sm:min-w-[7rem] sm:flex-none"
              >
                <span className="truncate">Next</span>
                <ChevronRight className="size-4 shrink-0" aria-hidden />
              </Button>
            </div>
          </nav>
        ) : null}
      </div>
    </section>
  );
}
