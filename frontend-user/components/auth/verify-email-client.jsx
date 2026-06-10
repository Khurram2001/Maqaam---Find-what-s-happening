"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck, MailX } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiJson } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const primaryButtonClass =
  "w-full gap-2 rounded-xl bg-[#0B4D53] text-white font-medium tracking-wide shadow-sm hover:bg-[#0B4D53]/90 transition-colors duration-200";

const secondaryButtonClass =
  "inline-flex w-full items-center justify-center bg-transparent text-[#0B4D53] border border-[#0B4D53]/20 font-medium py-2.5 rounded-xl transition-all hover:bg-[#0B4D53]/5";

export function VerifyEmailClient({ token }) {
  const [status, setStatus] = useState("ready");
  const [message, setMessage] = useState(null);

  const tokenInvalid = useMemo(() => !token || token.length < 10, [token]);

  async function handleConfirm() {
    setMessage(null);
    if (tokenInvalid) return;

    setStatus("loading");
    const { ok, json } = await apiJson("/auth/verify-email/confirm", {
      method: "POST",
      body: { token },
    });

    if (ok && json.success) {
      setStatus("success");
      return;
    }

    setStatus("error");
    setMessage(json?.error?.message || "We could not verify your email.");
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
            Email verification
          </CardTitle>
          <CardDescription className="text-sm text-[#0B4D53]/65">
            Confirm the address for your Maqaam account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 px-5 pb-6 sm:px-7 sm:pb-7">
          {tokenInvalid ? (
            <Alert variant="destructive">
              <MailX className="size-4" />
              <AlertTitle>Invalid link</AlertTitle>
              <AlertDescription className="text-sm leading-relaxed">
                This page needs a verification token in the URL. Open{" "}
                <strong className="text-foreground">Sign in</strong> on the home page and resend the
                verification email.
              </AlertDescription>
            </Alert>
          ) : null}

          {status === "ready" && !tokenInvalid ? (
            <p className="text-sm text-[#0B4D53]/70">
              When you are ready, confirm below. This link can only be used once.
            </p>
          ) : null}

          {status === "loading" ? (
            <div className="flex flex-col items-center gap-3 py-6 text-[#0B4D53]/60">
              <Loader2 className="size-8 animate-spin text-[#0B4D53]" aria-hidden />
              <p className="text-sm">Verifying your email</p>
            </div>
          ) : null}

          {status === "success" ? (
            <div className="space-y-4">
              <Alert className="border-[#0B4D53]/10 bg-[#FAF6F0]">
                <MailCheck className="size-4 text-[#0B4D53]" />
                <AlertTitle className="text-[#0B4D53]">Email verified</AlertTitle>
                <AlertDescription className="text-[#0B4D53]/70">
                  Your account is active. Sign in with your email and password.
                </AlertDescription>
              </Alert>
              <Link
                href="/?signin=1"
                className={cn(primaryButtonClass, "inline-flex h-11 items-center justify-center")}
              >
                Sign in
              </Link>
            </div>
          ) : null}

          {status === "error" ? (
            <Alert variant="destructive">
              <MailX className="size-4" />
              <AlertTitle>Verification failed</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          {status === "ready" && !tokenInvalid ? (
            <Button
              type="button"
              className={cn(primaryButtonClass, "h-11")}
              size="lg"
              onClick={handleConfirm}
              disabled={status === "loading"}
            >
              Verify my email
            </Button>
          ) : null}

          <div className="flex flex-col gap-2 pt-2">
            <Link href="/" className={secondaryButtonClass}>
              Back to home
            </Link>
            {status === "error" || tokenInvalid ? (
              <p className="text-center text-xs text-[#0B4D53]/60">
                On the home page, open <span className="font-medium text-[#0B4D53]">Sign in</span> and use{" "}
                <span className="font-medium text-[#0B4D53]">Resend verification</span> if you need a new link.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
