"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useEffect } from "react";
import { CalendarDays, Loader2, LogOut, ScrollText, Tags, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Events", icon: CalendarDays },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/users", label: "Users", icon: Users },
  { href: "/audit-logs", label: "Audit logs", icon: ScrollText },
];

function isNavActive(pathname, href) {
  if (href === "/") {
    return pathname === "/" || pathname.startsWith("/events/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarBrand() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-90">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FAF6F0] ring-1 ring-[#0B4D53]/10">
        <Image
          src="/maqaam-logo-teal.png"
          alt="Maqaam"
          width={26}
          height={26}
          className="object-contain"
          priority
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight text-[#0B4D53]">Maqaam</p>
        <p className="text-xs text-[#0B4D53]/55">Admin</p>
      </div>
    </Link>
  );
}

/**
 * @param {{
 *   userName: string;
 *   loggingOut: boolean;
 *   sessionLoading?: boolean;
 *   onLogout: () => void;
 *   onMobileClose?: () => void;
 *   className?: string;
 * }} props
 */
function AdminSidebarComponent({ userName, loggingOut, sessionLoading, onLogout, onMobileClose, className }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-[min(85vw,16rem)] shrink-0 flex-col border-r border-[#0B4D53]/10 bg-white sm:w-64",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#0B4D53]/8 px-4 pb-5 pt-6 sm:px-5 sm:pb-6 sm:pt-8">
        <SidebarBrand />
        {onMobileClose ? (
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-lg p-2 text-[#0B4D53]/60 transition-colors hover:bg-[#0B4D53]/5 hover:text-[#0B4D53] lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-5" aria-hidden />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 sm:py-5" aria-label="Admin navigation">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              prefetch
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-[#0B4D53] text-white shadow-sm"
                  : "text-[#0B4D53]/70 hover:bg-[#0B4D53]/5 hover:text-[#0B4D53]"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[#0B4D53]/8 p-4 pb-safe">
        <div className="mb-3 rounded-xl bg-[#FAF6F0] px-3 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#0B4D53]/50">Signed in as</p>
          {sessionLoading ? (
            <div className="mt-2 h-4 w-28 animate-pulse rounded-md bg-[#0B4D53]/10" aria-hidden />
          ) : (
            <p className="mt-0.5 truncate text-sm font-medium text-[#0B4D53]">{userName || "Admin"}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loggingOut || sessionLoading}
          onClick={onLogout}
          className="h-10 w-full justify-center gap-2"
        >
          {loggingOut ? <Loader2 className="animate-spin" aria-hidden /> : <LogOut aria-hidden />}
          Sign out
        </Button>
      </div>
    </aside>
  );
}

export const AdminSidebar = memo(AdminSidebarComponent);

/** Mobile drawer overlay wrapper */
export function AdminSidebarDrawer({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px] lg:hidden"
        onClick={onClose}
        aria-label="Close navigation overlay"
      />
      <div className="fixed inset-y-0 left-0 z-50 shadow-xl lg:hidden">{children}</div>
    </>
  );
}
