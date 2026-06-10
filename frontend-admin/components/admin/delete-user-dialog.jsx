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
import { isDeleteConfirmationTokenValid } from "@/lib/admin-validation";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-[#0B4D53] outline-none transition-colors focus:border-[#0B4D53] focus:ring-1 focus:ring-[#0B4D53]/20";

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   user: { id: string; name?: string; email?: string } | null;
 *   currentAdminId?: string;
 *   onSuccess?: () => void | Promise<void>;
 *   onError?: (message: string) => void;
 * }} props
 */
export function DeleteUserDialog({ open, onOpenChange, user, currentAdminId, onSuccess, onError }) {
  const [confirmToken, setConfirmToken] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [busy, setBusy] = useState(false);

  const isSelf = Boolean(user && currentAdminId && user.id === currentAdminId);

  function handleOpenChange(next) {
    if (!busy) {
      onOpenChange(next);
      if (!next) {
        setConfirmToken("");
        setFieldError("");
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user || isSelf) return;

    if (!isDeleteConfirmationTokenValid(confirmToken)) {
      setFieldError('Type DELETE exactly to confirm permanent removal.');
      return;
    }

    setFieldError("");
    setBusy(true);
    const res = await apiJson(`/admin/users/${user.id}`, { method: "DELETE" });
    setBusy(false);

    if (!res.ok || !res.json.success) {
      onError?.(res.json?.error?.message || "Delete failed.");
      return;
    }

    setConfirmToken("");
    onOpenChange(false);
    await onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Delete user permanently</DialogTitle>
            <DialogDescription>
              {user
                ? `This will permanently remove ${user.name || user.email || "this user"}. This action cannot be undone.`
                : "Confirm permanent user deletion."}
            </DialogDescription>
          </DialogHeader>

          {isSelf ? (
            <p className="rounded-xl border border-amber-200/60 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
              You cannot delete your own active admin session.
            </p>
          ) : (
            <div className="py-2">
              <label htmlFor="delete-confirm" className="text-xs font-medium text-[#0B4D53]/80">
                Type DELETE to confirm
              </label>
              <input
                id="delete-confirm"
                value={confirmToken}
                onChange={(e) => {
                  setConfirmToken(e.target.value);
                  if (fieldError) setFieldError("");
                }}
                className={inputClass}
                autoComplete="off"
                aria-invalid={!!fieldError}
              />
              {fieldError ? <p className="mt-1.5 text-xs text-red-700">{fieldError}</p> : null}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={busy || isSelf}>
              {busy ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  Deleting…
                </>
              ) : (
                "Delete user"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
