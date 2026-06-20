"use client";

import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Menu } from "lucide-react";

import { AdminMainLoading } from "@/components/admin/admin-main-loading";
import { AdminSessionProvider } from "@/components/admin/admin-session-context";
import { AdminSidebar, AdminSidebarDrawer } from "@/components/admin/admin-sidebar";
import { AdminToastProvider } from "@/components/admin/admin-toast-provider";
import { Button } from "@/components/ui/button";
import { apiJson } from "@/lib/api-client";

function Shell({ userName, sessionLoading, children, onLogout, loggingOut }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const tid = setTimeout(() => setMobileNavOpen(false), 0);
    return () => clearTimeout(tid);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#FAF6F0] lg:flex">
      <div className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:shrink-0">
        <AdminSidebar
          userName={userName}
          sessionLoading={sessionLoading}
          loggingOut={loggingOut}
          onLogout={onLogout}
        />
      </div>

      <AdminSidebarDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)}>
        <AdminSidebar
          userName={userName}
          sessionLoading={sessionLoading}
          loggingOut={loggingOut}
          onLogout={onLogout}
          onMobileClose={() => setMobileNavOpen(false)}
          className="h-full"
        />
      </AdminSidebarDrawer>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#0B4D53]/10 bg-white/95 px-4 py-3 pt-safe backdrop-blur-md lg:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu aria-hidden />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#FAF6F0] ring-1 ring-[#0B4D53]/10">
              <Image src="/maqaam-logo-teal.png" alt="" width={20} height={20} className="object-contain" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#0B4D53]">Maqaam Admin</p>
              <p className="truncate text-[11px] text-[#0B4D53]/60">{sessionLoading ? "Loading…" : userName}</p>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 pb-safe sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <Suspense fallback={<AdminMainLoading />}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}

export function AdminProtectedLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState("loading");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const sessionChecked = useRef(false);

  useEffect(() => {
    if (phase !== "guest") return;
    const next = pathname && pathname.startsWith("/") ? pathname : "/";
    router.replace(`/sign-in?next=${encodeURIComponent(next)}`);
  }, [phase, pathname, router]);

  useEffect(() => {
    if (sessionChecked.current) return undefined;
    let alive = true;

    const tid = setTimeout(async () => {
      const me = await apiJson("/auth/me");
      if (!alive) return;
      sessionChecked.current = true;

      const user = me.ok && me.json.success ? me.json.data?.user : null;
      if (!user) {
        setPhase("guest");
        return;
      }
      if (user.role !== "ADMIN") {
        setPhase("forbidden");
        return;
      }
      setUserName(user.name || user.email || "Admin");
      setUserId(user.id);
      setPhase("ready");
    }, 0);

    return () => {
      alive = false;
      clearTimeout(tid);
    };
  }, []);

  async function logout() {
    setLoggingOut(true);
    await apiJson("/auth/logout", { method: "POST" });
    setLoggingOut(false);
    setUserName("");
    setUserId("");
    sessionChecked.current = false;
    setPhase("guest");
  }

  if (phase === "guest") {
    return (
      <AdminToastProvider>
        <AdminMainLoading label="Redirecting to sign in…" />
      </AdminToastProvider>
    );
  }

  const sessionLoading = phase === "loading";
  const shellUserName = phase === "ready" ? userName : "";

  if (phase === "forbidden") {
    return (
      <AdminToastProvider>
        <AdminSessionProvider userId="" userName="">
          <Shell userName={shellUserName} sessionLoading={false} onLogout={logout} loggingOut={loggingOut}>
            <div className="mx-auto max-w-lg rounded-2xl border border-red-200/60 bg-white p-5 shadow-sm sm:p-6">
              <h1 className="text-lg font-semibold text-red-900 sm:text-xl">Admin role required</h1>
              <p className="mt-2 text-sm text-red-800/90">This account does not have admin permissions.</p>
              <Button type="button" variant="outline" className="mt-5 w-full sm:w-auto" disabled={loggingOut} onClick={logout}>
                {loggingOut ? "Signing out…" : "Switch account"}
              </Button>
            </div>
          </Shell>
        </AdminSessionProvider>
      </AdminToastProvider>
    );
  }

  return (
    <AdminToastProvider>
      <AdminSessionProvider userId={userId} userName={shellUserName}>
        <Shell
          userName={shellUserName}
          sessionLoading={sessionLoading}
          onLogout={logout}
          loggingOut={loggingOut}
        >
          {sessionLoading ? <AdminMainLoading label="Loading admin session…" /> : children}
        </Shell>
      </AdminSessionProvider>
    </AdminToastProvider>
  );
}
