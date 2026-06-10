import { Loader2 } from "lucide-react";

export function AdminMainLoading({ label = "Loading…" }) {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-100 bg-white/60 px-6 py-16 text-sm text-[#0B4D53]/65"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-6 animate-spin text-[#0B4D53]" aria-hidden />
      <p>{label}</p>
    </div>
  );
}
