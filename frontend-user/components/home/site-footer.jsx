import Image from "next/image";
import Link from "next/link";

import { FooterContactForm } from "./footer-contact-form";
import { HomeSectionLink } from "@/components/smooth-hash-scroll";
import { siteAssets } from "@/lib/site-assets";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#1c4f54] bg-[#06292d] text-[#F4F6F6]">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.25fr] lg:gap-14">
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-1 lg:gap-10">
            <div className="max-w-sm">
              <div className="flex items-center">
                <Image
                  src={siteAssets.brand.logoWhite}
                  alt="Maqaam"
                  width={132}
                  height={36}
                  className="h-7 w-auto object-contain sm:h-8"
                />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#D4E6F1]/80">
                A global, non-profit platform helping Muslim communities navigate and discover local
                gatherings with map-first precision.
              </p>

              <div className="mt-5 grid gap-2 text-sm text-[#F4F6F6]/80">
                <a
                  href="mailto:hello@maqaam.app"
                  className="w-fit text-[#D4E6F1]/85 underline-offset-4 transition hover:text-white hover:underline"
                >
                  hello@maqaam.app
                </a>
                <p className="text-xs text-[#D4E6F1]/70">
                  Support & queries · We typically respond within 24–48 hours.
                </p>
                <p className="text-xs text-[#D4E6F1]/70">Precision mapping powered by OpenStreetMap.</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4E6F1]/70">
                Explore
              </p>
              <div className="mt-3 flex flex-col gap-2 text-sm text-[#F4F6F6]/85">
                <Link href="/events" className="transition-colors hover:text-white">
                  Browse Events
                </Link>
                <Link href="/events/create" className="transition-colors hover:text-white">
                  Create Event
                </Link>
                <HomeSectionLink href="/#about-us" className="transition-colors hover:text-white">
                  Our Mission
                </HomeSectionLink>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4E6F1]/70">
              Contact
            </p>
            <p className="mt-2 text-sm text-[#F4F6F6]/85">
              Help & queries — send us a message.
            </p>
            <FooterContactForm />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-white/15 pt-5 text-xs text-[#D4E6F1]/75 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center sm:text-left">© {new Date().getFullYear()} Maqaam. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-end">
            <span>Non-Profit Project</span>
            <span aria-hidden>•</span>
            <span>Built for the Global Ummah</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
