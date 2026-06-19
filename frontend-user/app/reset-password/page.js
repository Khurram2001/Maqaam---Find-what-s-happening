import { Suspense } from "react";

import { ResetPasswordPageInner } from "./reset-password-inner";

export const metadata = {
  title: "Reset Password",
  description: "Set a new password for your Maqaam account.",
};

function ResetPasswordFallback() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center bg-[#FAF6F0] px-4 py-10 text-center text-sm text-[#0B4D53]/60 sm:min-h-[70vh] sm:px-6 sm:py-12">
      Loading…
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex-1 bg-[#FAF6F0]">
      <Suspense fallback={<ResetPasswordFallback />}>
        <ResetPasswordPageInner />
      </Suspense>
    </main>
  );
}
