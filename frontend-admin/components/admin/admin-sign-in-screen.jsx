"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { PasswordInput } from "@/components/ui/password-input";
import { adminLoginSchema, mapLoginFieldErrors } from "@/lib/admin-auth-validation";
import { apiJson } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const authInputClass =
  "block h-10 w-full rounded-xl border border-[#0B4D53]/20 bg-white px-3 py-2 text-sm text-[#0B4D53] placeholder:text-[#0B4D53]/40 outline-none transition-all focus:border-[#0B4D53] focus:ring-1 focus:ring-[#0B4D53]/20 disabled:cursor-not-allowed disabled:opacity-50";

const authLabelClass = "block text-xs font-medium text-[#0B4D53]/80";

const fieldErrorClass = "text-xs text-red-700";

const primaryAuthButtonClass =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B4D53] text-sm font-medium text-[#F4F6F0] shadow-sm transition-colors hover:bg-[#0a444a] disabled:cursor-not-allowed disabled:opacity-50";

const authToastClass = {
  error: "bg-[#3f1515] text-[#FEE2E2] ring-red-400/30",
};

export function AdminSignInScreen({ nextPath = "/", onSuccess }) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Sign In - Maqaam Admin";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(id);
  }, [toast]);

  function showErrorToast(message) {
    if (!message) return;
    setToast({ variant: "error", text: message });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    setToast(null);

    const parsed = adminLoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const nextErrors = mapLoginFieldErrors(parsed.error.flatten());
      setFieldErrors(nextErrors);
      const firstMessage = Object.values(nextErrors)[0];
      showErrorToast(firstMessage || "Please fix the highlighted fields.");
      return;
    }

    setBusy(true);

    const loginRes = await apiJson("/auth/login", {
      method: "POST",
      body: {
        email: parsed.data.email.toLowerCase(),
        password: parsed.data.password,
      },
    });

    if (!loginRes.ok || !loginRes.json.success) {
      setBusy(false);
      showErrorToast(loginRes.json?.error?.message || "Sign in failed.");
      return;
    }

    const me = await apiJson("/auth/me");
    const user = me.ok && me.json.success ? me.json.data?.user : null;

    if (!user || user.role !== "ADMIN") {
      await apiJson("/auth/logout", { method: "POST" });
      setBusy(false);
      showErrorToast("This account is not an admin account.");
      return;
    }

    if (onSuccess) {
      onSuccess(user);
      setBusy(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF6F0] px-4 py-8 pb-safe pt-safe sm:px-6 sm:py-12">
        <div className="w-full max-w-md rounded-2xl border border-[#0B4D53]/10 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0B4D53]/70">Maqaam Admin</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-[#0B4D53] sm:text-2xl">Welcome Back</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#0B4D53]/70">
            Sign in with an admin account to review gatherings, manage users, and view audit logs.
          </p>

          <form className="mt-6 flex flex-col gap-3" onSubmit={onSubmit} noValidate>
            <div className="flex w-full flex-col gap-1.5">
              <label htmlFor="admin-email" className={authLabelClass}>
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.email;
                      return next;
                    });
                  }
                }}
                className={cn(authInputClass, fieldErrors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "")}
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email ? <p className={fieldErrorClass}>{fieldErrors.email}</p> : null}
            </div>

            <div className="flex w-full flex-col gap-1.5">
              <label htmlFor="admin-password" className={authLabelClass}>
                Password
              </label>
              <PasswordInput
                id="admin-password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.password;
                      return next;
                    });
                  }
                }}
                className={cn(authInputClass, fieldErrors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "")}
                aria-invalid={!!fieldErrors.password}
              />
              {fieldErrors.password ? <p className={fieldErrorClass}>{fieldErrors.password}</p> : null}
            </div>

            <button type="submit" disabled={busy} className={cn(primaryAuthButtonClass, "mt-1")}>
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  <span>Signing in…</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>

      {toast ? (
        <div
          role="alert"
          aria-live="assertive"
          className={cn(
            "fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-50 w-[min(calc(100%-2rem),24rem)] -translate-x-1/2 rounded-xl px-4 py-3 text-center text-sm leading-relaxed shadow-lg ring-1",
            authToastClass[toast.variant]
          )}
        >
          {toast.text}
        </div>
      ) : null}
    </>
  );
}
