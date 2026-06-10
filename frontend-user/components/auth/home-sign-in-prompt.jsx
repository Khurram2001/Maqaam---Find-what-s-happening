"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { SignInDialog } from "@/components/auth/sign-in-dialog";

function HomeSignInPromptInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const signInRequested = searchParams.get("signin") === "1";
  const open = signInRequested && !dismissed;

  function handleOpenChange(next) {
    if (!next) {
      setDismissed(true);
      if (signInRequested) {
        router.replace("/", { scroll: false });
      }
    }
  }

  if (!open) return null;

  return (
    <SignInDialog
      open={open}
      onOpenChange={handleOpenChange}
      onSuccess={() => {
        setDismissed(true);
        router.replace("/", { scroll: false });
        router.refresh();
      }}
      hideTrigger
      defaultTab="login"
    />
  );
}

export function HomeSignInPrompt() {
  return (
    <Suspense fallback={null}>
      <HomeSignInPromptInner />
    </Suspense>
  );
}
