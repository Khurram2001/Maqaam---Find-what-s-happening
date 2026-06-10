"use client";

import { useEffect, useState } from "react";
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
import { slugifyCategorySlug, validateCategoryPayload } from "@/lib/admin-validation";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-[#0B4D53] outline-none transition-colors focus:border-[#0B4D53] focus:ring-1 focus:ring-[#0B4D53]/20";

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   mode: "create" | "edit";
 *   category?: { id: string; name: string; slug: string } | null;
 *   onSuccess?: () => void | Promise<void>;
 *   onError?: (message: string) => void;
 * }} props
 */
export function CategoryFormDialog({ open, onOpenChange, mode, category, onSuccess, onError }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const tid = window.setTimeout(() => {
      if (mode === "edit" && category) {
        setName(category.name || "");
        setSlug(category.slug || "");
        setSlugTouched(true);
      } else {
        setName("");
        setSlug("");
        setSlugTouched(false);
      }
      setFieldError("");
    }, 0);
    return () => window.clearTimeout(tid);
  }, [open, mode, category]);

  function handleOpenChange(next) {
    if (!busy) onOpenChange(next);
  }

  function handleNameChange(value) {
    setName(value);
    if (!slugTouched && mode === "create") {
      setSlug(slugifyCategorySlug(value));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validateCategoryPayload({ name, slug });
    if (validationError) {
      setFieldError(validationError);
      return;
    }

    setFieldError("");
    setBusy(true);

    const body = { name: name.trim(), slug: slug.trim() };
    const res =
      mode === "edit" && category
        ? await apiJson(`/categories/${category.id}`, { method: "PATCH", body })
        : await apiJson("/categories", { method: "POST", body });

    setBusy(false);

    if (!res.ok || !res.json.success) {
      const message = res.json?.error?.message || "Could not save category.";
      setFieldError(message);
      onError?.(message);
      return;
    }

    onOpenChange(false);
    await onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md border-neutral-100 bg-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-[#0B4D53]">
              {mode === "edit" ? "Edit category" : "Add category"}
            </DialogTitle>
            <DialogDescription>
              Categories appear in the user create-event form and browse filters.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="cat-name" className="text-sm font-medium text-[#0B4D53]">
                Name
              </label>
              <input
                id="cat-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={inputClass}
                placeholder="e.g. Youth Circles"
                maxLength={100}
                required
              />
            </div>
            <div>
              <label htmlFor="cat-slug" className="text-sm font-medium text-[#0B4D53]">
                Slug
              </label>
              <input
                id="cat-slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                className={inputClass}
                placeholder="e.g. youth-circles"
                maxLength={120}
                required
              />
              <p className="mt-1 text-xs text-[#0B4D53]/55">Lowercase letters, numbers, and hyphens only.</p>
            </div>
            {fieldError ? <p className="text-sm text-destructive">{fieldError}</p> : null}
          </div>

          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={busy} onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {mode === "edit" ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
