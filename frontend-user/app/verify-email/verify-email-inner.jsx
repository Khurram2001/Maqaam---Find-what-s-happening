"use client";

import { useSearchParams } from "next/navigation";

import { VerifyEmailClient } from "@/components/auth/verify-email-client";

function readVerifyToken(raw) {
  if (!raw) return "";
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

export function VerifyEmailPageInner() {
  const searchParams = useSearchParams();
  const token = readVerifyToken(searchParams.get("token"));
  return <VerifyEmailClient token={token} />;
}
