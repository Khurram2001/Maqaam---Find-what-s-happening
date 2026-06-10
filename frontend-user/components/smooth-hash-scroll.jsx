"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { hashFromHref, scrollToHash } from "@/lib/smooth-scroll";

/**
 * Smoothly scrolls to hash targets on the home page (initial load + hash changes).
 */
export function SmoothHashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return undefined;

    const id = window.location.hash.replace(/^#/, "");
    if (!id) return undefined;

    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const timer = window.setTimeout(() => {
      scrollToHash(id);
      window.history.scrollRestoration = previousRestoration;
    }, 120);

    return () => {
      window.clearTimeout(timer);
      window.history.scrollRestoration = previousRestoration;
    };
  }, [pathname]);

  useEffect(() => {
    const onHashChange = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (id) scrollToHash(id);
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return null;
}

/**
 * @param {React.MouseEvent<HTMLAnchorElement>} event
 * @param {string} href
 * @param {string} pathname
 */
export function handleHomeSectionLinkClick(event, href, pathname) {
  const id = hashFromHref(href);
  if (!id || pathname !== "/") return;

  event.preventDefault();
  window.history.pushState(null, "", href);
  scrollToHash(id);
}

/**
 * Link to a home page section with smooth scroll when already on `/`.
 * @param {{ href: string; className?: string; children: React.ReactNode }} props
 */
export function HomeSectionLink({ href, className, children }) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => handleHomeSectionLinkClick(event, href, pathname)}
    >
      {children}
    </Link>
  );
}
