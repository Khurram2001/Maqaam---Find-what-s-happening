import Image from "next/image";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import { siteAssets } from "@/lib/site-assets";

const trustPoints = [
  "Secure Admin Approval within 24h",
  "100% Free & Non-Profit Platform",
];

export function OrganizeEventBanner() {
  return (
    <section className="bg-[#FAF6F0] py-10 sm:py-12 lg:py-14">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] bg-[#041b1e] shadow-[0_22px_56px_rgba(11,77,83,0.34)]">
          <Image
            src={siteAssets.home.organizeBannerPrayer}
            alt="Community prayer gathering"
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

          <div className="relative flex min-h-[15rem] flex-col justify-center px-5 py-6 sm:min-h-[18rem] sm:px-8 sm:py-7 md:min-h-[20rem] md:px-10">
            <div className="w-full max-w-xl text-left">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#D4C4A8] sm:text-xs sm:tracking-[0.2em]">
                Organize An Event
              </p>
              <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-[#F4F6F6] drop-shadow-md sm:text-3xl md:text-4xl">
                Have a Gathering to Share?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#D4E6F1]/90 sm:mt-3 sm:text-base">
                Pin your upcoming lecture, community circle, or event on the Maqaam map.
              </p>
              <div className="mt-5 sm:mt-6">
                <Link
                  href="/events/create"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#F4F6F6] px-6 text-sm font-semibold text-[#0B4D53] shadow-[0_8px_20px_rgba(5,31,34,0.25)] transition-all duration-300 hover:bg-white hover:ring-2 hover:ring-[#0B4D53] sm:h-12 sm:w-auto sm:px-7 sm:hover:scale-105"
                >
                  <CalendarPlus className="size-4 shrink-0" aria-hidden />
                  Organize your event
                </Link>
              </div>
              <ul className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
                {trustPoints.map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-1.5 text-xs text-[#F4F6F6]/80"
                  >
                    <span className="text-[#A8D4C4]" aria-hidden>
                      ✓
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
