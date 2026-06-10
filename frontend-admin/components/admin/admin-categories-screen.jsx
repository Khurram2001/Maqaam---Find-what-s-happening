"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

import { CategoryFormDialog } from "@/components/admin/category-form-dialog";
import { DeleteCategoryDialog } from "@/components/admin/delete-category-dialog";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import {
  AdminDesktopOnly,
  AdminEmptyCards,
  AdminLoadingCards,
  AdminLoadingRow,
  AdminMobileCard,
  AdminMobileOnly,
  AdminPageHeader,
  adminTableShellClass,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { apiJson } from "@/lib/api-client";
import { formatAdminDateTime } from "@/lib/admin-format";

export function AdminCategoriesScreen() {
  const toast = useAdminToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    const res = await apiJson("/categories");
    if (!res.ok || !res.json.success) {
      toast.error(res.json?.error?.message || "Could not load categories.");
      setLoading(false);
      return;
    }
    setCategories(res.json.data?.categories ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    const tid = setTimeout(() => void loadCategories(), 0);
    return () => clearTimeout(tid);
  }, [loadCategories]);

  function openCreate() {
    setFormMode("create");
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(category) {
    setFormMode("edit");
    setEditTarget(category);
    setFormOpen(true);
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Manage gathering categories shown when hosts create events and when users browse listings."
        actions={
          <>
            <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => loadCategories()}>
              <RefreshCw className="size-4" aria-hidden />
              Refresh
            </Button>
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-4" aria-hidden />
              Add category
            </Button>
          </>
        }
      />

      {loading ? <AdminLoadingCards label="Loading categories…" /> : null}
      {!loading && categories.length === 0 ? (
        <AdminEmptyCards message="No categories yet. Add one so hosts can classify gatherings." />
      ) : null}

      <AdminMobileOnly>
        {!loading &&
          categories.map((category) => (
            <AdminMobileCard key={category.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-[#0B4D53]">{category.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-[#0B4D53]/60">{category.slug}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#FAF6F0] px-2.5 py-0.5 text-xs font-medium text-[#0B4D53]">
                  {category.eventCount ?? 0} gatherings
                </span>
              </div>
              <p className="mt-2 text-xs text-[#0B4D53]/55">Created {formatAdminDateTime(category.createdAt)}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => openEdit(category)}>
                  <Pencil className="size-3.5" aria-hidden />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => setDeleteTarget(category)}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Delete
                </Button>
              </div>
            </AdminMobileCard>
          ))}
      </AdminMobileOnly>

      <AdminDesktopOnly>
        <div className={adminTableShellClass}>
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="min-w-[40rem] w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-[#FAF6F0]/60 text-xs uppercase tracking-wide text-[#0B4D53]/60">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Slug</th>
                  <th className="px-6 py-4 font-medium">Gatherings</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <AdminLoadingRow colSpan={5} label="Loading categories…" />
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-[#0B4D53]/60">
                      No categories yet.
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="align-top transition-colors hover:bg-[#FAF6F0]/40">
                      <td className="px-6 py-5 font-medium text-[#0B4D53]">{category.name}</td>
                      <td className="px-6 py-5 font-mono text-xs text-[#0B4D53]/70">{category.slug}</td>
                      <td className="px-6 py-5 tabular-nums text-[#0B4D53]/80">{category.eventCount ?? 0}</td>
                      <td className="px-6 py-5 text-xs text-[#0B4D53]/75">
                        {formatAdminDateTime(category.createdAt)}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(category)}>
                            <Pencil className="size-3.5" aria-hidden />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTarget(category)}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AdminDesktopOnly>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        category={editTarget}
        onSuccess={async () => {
          toast.success(formMode === "edit" ? "Category updated." : "Category created.");
          await loadCategories();
        }}
        onError={(message) => toast.error(message)}
      />

      <DeleteCategoryDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        category={deleteTarget}
        onSuccess={async () => {
          toast.success("Category deleted.");
          setDeleteTarget(null);
          await loadCategories();
        }}
        onError={(message) => toast.error(message)}
      />
    </>
  );
}
