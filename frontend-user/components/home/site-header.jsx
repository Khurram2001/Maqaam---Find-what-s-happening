"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, User, X } from "lucide-react";

import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { UserMenu } from "@/components/auth/user-menu";
import { handleHomeSectionLinkClick } from "@/components/smooth-hash-scroll";
import { apiJson } from "@/lib/api-client";
import { siteAssets } from "@/lib/site-assets";
import { cn } from "@/lib/utils";

const CREATE_EVENT_HREF = "/events/new";

const navLinks = [
  { href: CREATE_EVENT_HREF, label: "Create Event", requiresAuth: true },
  { href: "/events", label: "Browse Events" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#about-us", label: "About us" },
];

export function SiteHeader({ variant = "default" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [heroScrolled, setHeroScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [createEventChecking, setCreateEventChecking] = useState(false);
  const isHero = variant === "hero";
  const heroOverlay = isHero && !heroScrolled;

  const refreshUser = useCallback(async () => {
    try {
      const { ok, json } = await apiJson("/auth/me");
      if (ok && json.success && json.data?.user) {
        setUser(json.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      void refreshUser();
    }, 0);
    return () => clearTimeout(id);
  }, [refreshUser]);

  useEffect(() => {
    if (!isHero) return;

    const onScroll = () => {
      setHeroScrolled(window.scrollY > 48);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHero]);

  useEffect(() => {
    const id = window.setTimeout(() => setMobileOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  function navLinkClassName(isMobile = false) {
    if (isMobile) {
      return "block rounded-xl px-3 py-3 text-base font-medium text-[#0B4D53] transition-colors hover:bg-[#0B4D53]/5";
    }
    return cn(
      "transition-colors",
      heroOverlay ? "text-white/80 hover:text-white" : "text-[#0B4D53]/75 hover:text-[#0B4D53]"
    );
  }

  async function handleCreateEventClick(event) {
    event.preventDefault();
    if (createEventChecking) return;

    setMobileOpen(false);

    if (user) {
      router.push(CREATE_EVENT_HREF);
      return;
    }

    setCreateEventChecking(true);
    try {
      const { ok, json } = await apiJson("/auth/me");
      if (ok && json.success && json.data?.user) {
        setUser(json.data.user);
        router.push(CREATE_EVENT_HREF);
        return;
      }
    } catch {
      /* treat as signed out */
    } finally {
      setCreateEventChecking(false);
    }

    setCreateEventDialogOpen(true);
  }

  function handleMobileNavClick(event, item) {
    if (item.requiresAuth) {
      void handleCreateEventClick(event);
      return;
    }
    if (item.href.includes("#")) {
      handleHomeSectionLinkClick(event, item.href, pathname);
    }
    setMobileOpen(false);
  }

  function renderNavItem(item, isMobile = false) {
    if (item.requiresAuth) {
      return (
        <button
          key={item.href}
          type="button"
          disabled={createEventChecking}
          onClick={handleCreateEventClick}
          className={cn(
            navLinkClassName(isMobile),
            isMobile ? "w-full text-left" : "cursor-pointer bg-transparent"
          )}
        >
          {item.label}
        </button>
      );
    }

    if (item.href.includes("#")) {
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={(event) => handleHomeSectionLinkClick(event, item.href, pathname)}
          className={navLinkClassName(isMobile)}
        >
          {item.label}
        </Link>
      );
    }

    return (
      <Link key={item.href} href={item.href} className={navLinkClassName(isMobile)}>
        {item.label}
      </Link>
    );
  }

  const authControl = !user ? (
    <SignInDialog
      onSuccess={refreshUser}
      triggerLabel="Sign in"
      triggerIcon={<User className="size-4 shrink-0" aria-hidden />}
      triggerVariant="outline"
      triggerSize="sm"
      defaultTab="login"
      triggerClassName={cn(
        "h-9 gap-1.5 rounded-full px-3.5 sm:h-10 sm:px-4",
        heroOverlay && !mobileOpen
          ? "border-white/25 bg-white/10 text-white hover:border-white/45 hover:bg-white/15"
          : "border-[#0B4D53]/20 bg-white/80 text-[#0B4D53] hover:bg-white"
      )}
    />
  ) : (
    <UserMenu user={user} onLogout={refreshUser} heroOverlay={heroOverlay && !mobileOpen} />
  );

  return (
    <>
      <header
        className={cn(
          "z-50 w-full",
          isHero
            ? cn(
                "fixed inset-x-0 top-0 transition-all duration-300",
                heroScrolled || mobileOpen
                  ? "border-b border-[#0B4D53]/10 bg-[#FAF6F0]/95 shadow-sm backdrop-blur-md"
                  : "bg-transparent"
              )
            : "sticky top-0 border-b border-[#0B4D53]/10 bg-[#FAF6F0]/95 shadow-sm backdrop-blur-md"
        )}
      >
        <div
          className={cn(
            "mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-8",
            isHero ? "sm:pt-0" : ""
          )}
        >
          <Link
            href="/"
            className="flex min-w-0 items-center transition-opacity hover:opacity-85"
            aria-label="Maqaam home"
          >
            <Image
              src={
                heroOverlay && !mobileOpen
                  ? siteAssets.brand.logoWhite
                  : siteAssets.brand.logoTeal
              }
              alt="Maqaam"
              width={156}
              height={42}
              className="h-8 w-auto object-contain sm:h-9 md:h-10"
              priority
            />
          </Link>

          <nav
            className={cn(
              "hidden items-center gap-5 text-sm lg:flex xl:gap-6",
              heroOverlay ? "text-white/80" : "text-[#0B4D53]/75"
            )}
          >
            {navLinks.map((item) => renderNavItem(item))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:block">{authControl}</div>

            <button
              type="button"
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-lg border transition-colors lg:hidden",
                heroOverlay && !mobileOpen
                  ? "border-white/25 bg-white/10 text-white hover:bg-white/15"
                  : "border-[#0B4D53]/15 bg-white/80 text-[#0B4D53] hover:bg-white"
              )}
              aria-expanded={mobileOpen}
              aria-controls="mobile-site-nav"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div
          id="mobile-site-nav"
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 overflow-y-auto border-b border-[#0B4D53]/10 bg-[#FAF6F0]/98 backdrop-blur-md lg:hidden",
            isHero ? "top-14 sm:top-16" : "top-14 sm:top-16"
          )}
        >
          <nav className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            {navLinks.map((item) =>
              item.requiresAuth ? (
                renderNavItem(item, true)
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(event) => handleMobileNavClick(event, item)}
                  className={navLinkClassName(true)}
                >
                  {item.label}
                </Link>
              )
            )}
            <div className="mt-3 border-t border-[#0B4D53]/10 pt-4 sm:hidden">{authControl}</div>
          </nav>
        </div>
      ) : null}

      <SignInDialog
        open={createEventDialogOpen}
        onOpenChange={setCreateEventDialogOpen}
        onSuccess={async () => {
          setCreateEventDialogOpen(false);
          await refreshUser();
          router.push(CREATE_EVENT_HREF);
        }}
        hideTrigger
        defaultTab="login"
      />
    </>
  );
}
