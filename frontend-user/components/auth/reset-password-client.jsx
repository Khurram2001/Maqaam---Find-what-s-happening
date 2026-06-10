"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { Loader2, Lock } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { apiJson } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const resetInputClass =
  "px-4 py-2.5 rounded-xl border border-neutral-200/80 bg-white text-[#0B4D53] placeholder:text-[#0B4D53]/40 focus:border-[#0B4D53] focus:ring-1 focus:ring-[#0B4D53] outline-none transition-all";

const resetLabelClass = "text-xs font-medium text-[#0B4D53]/80";

const primaryButtonClass =
  "w-full gap-2 rounded-xl bg-[#0B4D53] text-white font-medium tracking-wide shadow-sm hover:bg-[#0B4D53]/90 transition-colors duration-200";

const secondaryButtonClass =
  "inline-flex w-full items-center justify-center bg-transparent text-[#0B4D53] border border-[#0B4D53]/20 font-medium py-2.5 rounded-xl transition-all hover:bg-[#0B4D53]/5";

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, "At least 8 characters").max(128),
    confirm: z.string().min(1, "Confirm your password"),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirm"],
      });
    }
  });

export function ResetPasswordClient({ token }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const tokenInvalid = useMemo(() => !token || token.length < 10, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setBanner(null);
    setFieldErrors({});

    if (tokenInvalid) {
      setBanner("This link is missing a token or it is too short. Request a new reset email.");
      return;
    }

    const parsed = passwordSchema.safeParse({ newPassword: password, confirm });
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      const next = {};
      if (fe.newPassword?.[0]) next.newPassword = fe.newPassword[0];
      if (fe.confirm?.[0]) next.confirm = fe.confirm[0];
      setFieldErrors(next);
      return;
    }

    setPending(true);
    const { ok, json } = await apiJson("/auth/reset-password", {
      method: "POST",
      body: {
        token,
        newPassword: parsed.data.newPassword,
      },
    });
    setPending(false);

    if (ok && json.success) {
      setDone(true);
      return;
    }

    const details = json?.error?.details?.fieldErrors;
    if (details && typeof details === "object") {
      const next = {};
      for (const [k, v] of Object.entries(details)) {
        if (Array.isArray(v) && v[0]) next[k] = v[0];
      }
      if (Object.keys(next).length) setFieldErrors(next);
    }
    setBanner(json?.error?.message || "Could not reset password.");
  }

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center bg-[#FAF6F0] px-4 py-10 sm:min-h-[70vh] sm:px-6 sm:py-12">
      <Link
        href="/"
        className="mb-6 text-center text-sm font-medium text-[#0B4D53] transition-colors hover:text-[#0B4D53]/80 sm:mb-8"
      >
        ← Maqaam
      </Link>

      <Card className="rounded-2xl border border-[#0B4D53]/10 bg-white shadow-sm">
        <CardHeader className="px-5 pb-3 pt-6 sm:px-7 sm:pb-4 sm:pt-7">
          <CardTitle className="font-heading text-lg font-semibold tracking-tight text-[#0B4D53] sm:text-xl">
            Set a new password
          </CardTitle>
          <CardDescription className="text-sm text-[#0B4D53]/65">
            Choose a strong password for your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-5 pb-6 sm:px-7 sm:pb-7">
          {done ? (
            <div className="space-y-4">
              <Alert className="border-[#0B4D53]/10 bg-[#FAF6F0]">
                <Lock className="size-4 text-[#0B4D53]" />
                <AlertTitle className="text-[#0B4D53]">Password updated</AlertTitle>
                <AlertDescription className="text-[#0B4D53]/70">
                  Your password has been changed. Sign in with your email and new password.
                </AlertDescription>
              </Alert>
              <Link
                href="/?signin=1"
                className={cn(primaryButtonClass, "inline-flex h-11 items-center justify-center")}
              >
                Sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {tokenInvalid ? (
                <Alert variant="destructive">
                  <AlertTitle>Invalid link</AlertTitle>
                  <AlertDescription>
                    Open <strong className="text-foreground">Sign in</strong>, then use{" "}
                    <strong className="text-foreground">Forgot password?</strong> to receive a new link.
                  </AlertDescription>
                </Alert>
              ) : null}

              {banner ? (
                <Alert variant="destructive">
                  <AlertDescription>{banner}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="new-password" className={resetLabelClass}>
                  New password
                </Label>
                <PasswordInput
                  id="new-password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(resetInputClass, fieldErrors.newPassword ? "border-destructive" : "")}
                  disabled={tokenInvalid}
                  aria-invalid={!!fieldErrors.newPassword}
                />
                {fieldErrors.newPassword ? (
                  <p className="text-xs text-destructive">{fieldErrors.newPassword}</p>
                ) : (
                  <p className="mt-1 text-xs tracking-wide text-[#0B4D53]/60">At least 8 characters.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className={resetLabelClass}>
                  Confirm password
                </Label>
                <PasswordInput
                  id="confirm-password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={cn(resetInputClass, fieldErrors.confirm ? "border-destructive" : "")}
                  disabled={tokenInvalid}
                  aria-invalid={!!fieldErrors.confirm}
                />
                {fieldErrors.confirm ? <p className="text-xs text-destructive">{fieldErrors.confirm}</p> : null}
              </div>

              <Button
                type="submit"
                className={cn(primaryButtonClass, "h-11")}
                size="lg"
                disabled={pending || tokenInvalid}
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
            </form>
          )}

          <div className="mt-5">
            <Link href="/" className={secondaryButtonClass}>
              Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
