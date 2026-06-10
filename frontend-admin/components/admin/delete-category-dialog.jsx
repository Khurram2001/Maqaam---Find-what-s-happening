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
 *   category: { id: string; name: string; eventCount?: number } | null;
 *   onSuccess?: () => void | Promise<void>;
 *   onError?: (message: string) => void;
 * }} props
 */
export function DeleteCategoryDialog({ open, onOpenChange, category, onSuccess, onError }) {
  const [confirmToken, setConfirmToken] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [busy, setBusy] = useState(false);

  const blocked = Boolean(category?.eventCount && category.eventCount > 0);

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
    if (!category || blocked) return;

    if (!isDeleteConfirmationTokenValid(confirmToken)) {
      setFieldError("Type DELETE exactly to confirm removal.");
      return;
    }

    setFieldError("");
    setBusy(true);
    const res = await apiJson(`/categories/${category.id}`, { method: "DELETE" });
    setBusy(false);

    if (!res.ok || !res.json.success) {
      const message = res.json?.error?.message || "Could not delete category.";
      setFieldError(message);
      onError?.(message);
      return;
    }

    handleOpenChange(false);
    await onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md border-neutral-100 bg-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-[#0B4D53]">Delete category</DialogTitle>
            <DialogDescription>
              {blocked ? (
                <>
                  <strong>{category?.name}</strong> is used by {category?.eventCount} gathering(s). Reassign or
                  remove those gatherings before deleting this category.
                </>
              ) : (
                <>
                  Permanently remove <strong>{category?.name}</strong>. This cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {!blocked ? (
            <div className="mt-4">
              <label htmlFor="cat-delete-confirm" className="text-sm font-medium text-[#0B4D53]">
                Type DELETE to confirm
              </label>
              <input
                id="cat-delete-confirm"
                value={confirmToken}
                onChange={(e) => setConfirmToken(e.target.value)}
                className={inputClass}
                autoComplete="off"
              />
              {fieldError ? <p className="mt-2 text-sm text-destructive">{fieldError}</p> : null}
            </div>
          ) : null}

          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={busy} onClick={() => handleOpenChange(false)}>
              {blocked ? "Close" : "Cancel"}
            </Button>
            {!blocked ? (
              <Button type="submit" variant="destructive" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
                Delete category
              </Button>
            ) : null}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
