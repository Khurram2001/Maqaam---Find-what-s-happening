import { Suspense } from "react";

import { VerifyEmailPageInner } from "./verify-email-inner";

export const metadata = {
  title: "Verify email · Maqaam",
  description: "Confirm your email address to activate your Maqaam account.",
};

function VerifyEmailFallback() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center bg-[#FAF6F0] px-4 py-10 text-center text-sm text-[#0B4D53]/60 sm:min-h-[70vh] sm:px-6 sm:py-12">
      Loading…
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex-1 bg-[#FAF6F0]">
      <Suspense fallback={<VerifyEmailFallback />}>
        <VerifyEmailPageInner />
      </Suspense>
    </main>
  );
}
