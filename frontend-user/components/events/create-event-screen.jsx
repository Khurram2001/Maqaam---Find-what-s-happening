"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { CreateEventForm } from "@/components/events/create-event-form";
import { apiJson } from "@/lib/api-client";

export function CreateEventScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState("loading");
  const [signInOpen, setSignInOpen] = useState(false);

  const load = useCallback(async () => {
    const me = await apiJson("/auth/me");
    if (me.ok && me.json.success && me.json.data?.user) {
      setPhase("ready");
      setSignInOpen(false);
    } else {
      setPhase("guest");
      setSignInOpen(true);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  if (phase === "loading") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-3 px-4 py-16 text-muted-foreground sm:py-24">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm">Checking your session…</p>
      </div>
    );
  }

  if (phase === "guest") {
    return (
      <>
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-3 px-4 py-16 text-muted-foreground sm:py-24">
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
          <p className="text-sm">Sign in to continue</p>
        </div>
        <SignInDialog
          open={signInOpen}
          onOpenChange={(open) => {
            setSignInOpen(open);
            if (!open) router.replace("/");
          }}
          onSuccess={async () => {
            setSignInOpen(false);
            setPhase("ready");
          }}
          hideTrigger
          defaultTab="login"
        />
      </>
    );
  }

  return <CreateEventForm />;
}
