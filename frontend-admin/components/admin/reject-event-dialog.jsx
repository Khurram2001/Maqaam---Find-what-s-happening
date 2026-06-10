"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiJson } from "@/lib/api-client";
import { normalizeRejectReason } from "@/lib/admin-validation";

const rejectSchema = z.object({
  rejectionReason: z.string().trim().min(3, "Reason must be at least 3 characters.").max(500, "Reason must be at most 500 characters."),
});

const inputClass =
  "mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-[#0B4D53] outline-none transition-colors focus:border-[#0B4D53] focus:ring-1 focus:ring-[#0B4D53]/20";

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   eventId: string | null;
 *   eventTitle?: string;
 *   onSuccess?: () => void | Promise<void>;
 *   onError?: (message: string) => void;
 * }} props
 */
export function RejectEventDialog({ open, onOpenChange, eventId, eventTitle, onSuccess, onError }) {
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [busy, setBusy] = useState(false);

  function handleOpenChange(next) {
    if (!busy) {
      onOpenChange(next);
      if (!next) {
        setReason("");
        setFieldError("");
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!eventId) return;

    const parsed = rejectSchema.safeParse({ rejectionReason: normalizeRejectReason(reason) });
    if (!parsed.success) {
      setFieldError(parsed.error.flatten().fieldErrors.rejectionReason?.[0] || "Invalid rejection reason.");
      return;
    }

    setFieldError("");
    setBusy(true);
    const res = await apiJson(`/admin/events/${eventId}/reject`, {
      method: "PATCH",
      body: { rejectionReason: parsed.data.rejectionReason },
    });
    setBusy(false);

    if (!res.ok || !res.json.success) {
      onError?.(res.json?.error?.message || "Reject failed.");
      return;
    }

    setReason("");
    onOpenChange(false);
    await onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Reject gathering</DialogTitle>
            <DialogDescription>
              {eventTitle
                ? `Provide a clear reason for rejecting “${eventTitle}”. The host will see this message.`
                : "Provide a clear rejection reason for the host (3–500 characters)."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <label htmlFor="reject-reason" className="text-xs font-medium text-[#0B4D53]/80">
              Rejection reason
            </label>
            <textarea
              id="reject-reason"
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (fieldError) setFieldError("");
              }}
              placeholder="Explain what needs to change before this gathering can be listed…"
              className={inputClass}
              aria-invalid={!!fieldError}
            />
            {fieldError ? <p className="mt-1.5 text-xs text-red-700">{fieldError}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  Rejecting…
                </>
              ) : (
                "Reject gathering"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
