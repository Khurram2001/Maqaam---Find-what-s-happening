"use client";

import { useSearchParams } from "next/navigation";

import { ResetPasswordClient } from "@/components/auth/reset-password-client";

function readResetToken(raw) {
  if (!raw) return "";
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

export function ResetPasswordPageInner() {
  const searchParams = useSearchParams();
  const token = readResetToken(searchParams.get("token"));
  return <ResetPasswordClient token={token} />;
}
