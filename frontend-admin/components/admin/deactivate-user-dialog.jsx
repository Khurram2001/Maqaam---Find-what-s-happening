"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

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

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   user: { id: string; name?: string; email?: string } | null;
 *   onSuccess?: () => void | Promise<void>;
 *   onError?: (message: string) => void;
 * }} props
 */
export function DeactivateUserDialog({ open, onOpenChange, user, onSuccess, onError }) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    if (!user) return;
    setBusy(true);
    const res = await apiJson(`/admin/users/${user.id}/deactivate`, { method: "PATCH" });
    setBusy(false);

    if (!res.ok || !res.json.success) {
      onError?.(res.json?.error?.message || "Deactivate failed.");
      return;
    }

    onOpenChange(false);
    await onSuccess?.();
  }

  function handleOpenChange(next) {
    if (!busy) onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate account</DialogTitle>
          <DialogDescription>
            {user
              ? `Deactivate ${user.name || user.email || "this user"}? They will no longer be able to sign in until reactivated.`
              : "Confirm account deactivation."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="primary" disabled={busy} onClick={confirm}>
            {busy ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Deactivating…
              </>
            ) : (
              "Deactivate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
