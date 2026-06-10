import Link from "next/link";
import Image from "next/image";

import { siteAssets } from "@/lib/site-assets";
import { cn } from "@/lib/utils";

import { HeroGeometry } from "./hero-geometry";
import { SiteHeader } from "./site-header";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <Image
          src={siteAssets.home.heroLandscape}
          alt="Grand mosque landscape"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/60 to-black/75" />
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <HeroGeometry />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-black/20 to-[#FAF6F0]" />

      <SiteHeader variant="hero" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28 md:pb-20 md:pt-32 lg:px-8 lg:pb-24 lg:pt-36">
        <div className="grid w-full items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="min-w-0 text-left">
            <p
              className="mb-2 text-base leading-relaxed tracking-wide text-[#2DD4BF] drop-shadow-[0_0_12px_rgba(45,212,191,0.4)] motion-safe:opacity-0 motion-safe:animate-[fadeInUp_0.8s_ease-out_0.05s_forwards] sm:mb-3 sm:text-lg md:text-xl lg:text-2xl"
              style={{
                fontFamily: "var(--font-arabic-display), serif",
                textShadow: "0 0 12px rgba(45, 212, 191, 0.4)",
              }}
              dir="rtl"
            >
              اكتشف ما يحدث من حولك
            </p>
            <h1 className="font-heading text-balance text-2xl font-semibold tracking-tight text-white drop-shadow-sm motion-safe:opacity-0 motion-safe:animate-[fadeInUp_0.8s_ease-out_0.15s_forwards] sm:text-4xl md:text-5xl">
              Locate &amp; Share Local Islamic Gatherings
            </h1>
            <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-white/80 motion-safe:opacity-0 motion-safe:animate-[fadeInUp_0.8s_ease-out_0.3s_forwards] sm:mt-4 sm:text-base">
              Maqaam is a non-profit, map-first discovery platform helping the Muslim community
              navigate local gatherings. Pin or discover verified Islamic lectures, halaqas, and Eid
              events with precise spatial locations—built for trust, security, and spiritual
              connection.
            </p>
            <div className="mt-6 motion-safe:opacity-0 motion-safe:animate-[fadeInUp_0.8s_ease-out_0.45s_forwards] sm:mt-8">
              <Link
                href="/events"
                className={cn(
                  "inline-flex h-11 w-full shrink-0 items-center justify-center rounded-full border border-[#2DD4BF]/30 bg-[#0B4D53] px-6 text-sm font-medium text-white shadow-[0_8px_22px_rgba(11,77,83,0.38)] outline-none transition-all duration-300 ease-in-out",
                  "hover:border-[#2DD4BF] hover:bg-[#0a444a] hover:text-white hover:shadow-[0_0_20px_rgba(45,212,191,0.5),0_8px_22px_rgba(11,77,83,0.38)]",
                  "focus-visible:ring-3 focus-visible:ring-[#2DD4BF]/40",
                  "sm:h-12 sm:w-auto sm:min-w-[11.5rem] sm:px-7 motion-safe:sm:hover:scale-[1.03]"
                )}
              >
                Explore the Map ↗
              </Link>
            </div>
          </div>

          <div className="hidden w-full min-w-0 rounded-2xl border border-white/20 bg-white/10 p-2.5 backdrop-blur-md motion-safe:opacity-0 motion-safe:animate-[fadeInUp_1s_ease-out_0.2s_forwards] sm:block sm:p-3">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl sm:aspect-[4/3]">
              <Image
                src={siteAssets.home.heroLandscape}
                alt="Featured landscape"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 560px"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4">
                <p className="text-sm font-medium text-white/95">Moments worth gathering for</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
